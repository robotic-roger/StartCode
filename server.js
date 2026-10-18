
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

function extrairJson(texto) {
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extrairCampo(texto, campo) {
  const marcador = `"${campo}"`;
  const inicioCampo = texto.indexOf(marcador);

  if (inicioCampo === -1) return null;

  const doisPontos = texto.indexOf(':', inicioCampo);
  if (doisPontos === -1) return null;

  let i = doisPontos + 1;

  while (i < texto.length && /\s/.test(texto[i])) i++;

  if (texto[i] !== '"') return null;

  i++;

  let valor = '';
  let escape = false;

  for (; i < texto.length; i++) {
    const c = texto[i];

    if (escape) {
      valor += c === 'n' ? '\n'
        : c === 'r' ? '\r'
        : c === 't' ? '\t'
        : c;
      escape = false;
    } else if (c === '\\') {
      escape = true;
    } else if (c === '"') {
      return valor;
    } else {
      valor += c;
    }
  }

  return null;
}

// GERAÇÃO DO CÓDIGO ARDUINO
app.post('/api/gerar-codigo', async (req, res) => {
  const inicio = Date.now();

  try {
    const prompt = String(req.body?.prompt || '').trim();

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Descreva o projeto que deseja criar.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'A chave GEMINI_API_KEY não está configurada na Vercel.'
      });
    }

    const promptCompleto = `
Você é o StartCode, especialista em Arduino e robótica educacional.

Pedido do aluno:
${prompt}

Retorne exclusivamente JSON válido com as chaves "code" e "explanation".

{
  "code": "código C++ completo para Arduino",
  "explanation": "explicação didática em HTML simples"
}

Regras:
- O código deve ser completo e conter setup() e loop().
- Use bibliotecas apropriadas quando necessárias.
- Não invente componentes ou conexões não informados.
- Explicite suposições importantes na explicação.
- Explique o funcionamento em português brasileiro.
- Use HTML simples na explicação.
- Não afirme que o código foi testado fisicamente.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: promptCompleto,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 3000,
        temperature: 0.2
      }
    });

    const dados = JSON.parse(extrairJson(response.text || ''));

    if (!dados.code || !dados.explanation) {
      throw new Error('Resposta incompleta do modelo.');
    }

    console.log(`[StartCode] Código gerado em ${Date.now() - inicio} ms`);

    return res.json({
      success: true,
      code: dados.code,
      explanation: dados.explanation
    });
  } catch (erro) {
    console.error('[StartCode] Erro na geração:', erro);

    return res.status(500).json({
      success: false,
      error: 'Não foi possível gerar o código Arduino. Tente novamente.'
    });
  }
});

// GERAÇÃO DO FLUXOGRAMA A PARTIR DO CÓDIGO ARDUINO
app.post('/api/gerar-fluxograma', async (req, res) => {
  try {
    const codigo = String(req.body?.code || '').trim();

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Gere ou informe o código Arduino antes de criar o fluxograma.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'A chave GEMINI_API_KEY não está configurada na Vercel.'
      });
    }

    if (codigo.length > 20000) {
      return res.status(413).json({
        success: false,
        error: 'O código é muito longo para gerar o fluxograma.'
      });
    }

    const instrucao = `
Você é especialista em algoritmos, Arduino e fluxogramas didáticos.

Analise o código Arduino abaixo e represente sua lógica em um fluxograma Mermaid.

CÓDIGO ARDUINO:
<codigo>
${codigo}
</codigo>

Retorne exclusivamente um JSON válido no formato:
{
  "title": "Título curto do fluxograma",
  "diagram": "flowchart TD\\n..."
}

REGRAS OBRIGATÓRIAS:
- Use Mermaid flowchart TD.
- O fluxograma deve refletir o código fornecido, não um programa imaginado.
- Inclua Início e Fim quando representarem corretamente o fluxo.
- Represente setup() como inicialização e loop() como repetição contínua.
- Use retângulos para processos.
- Use losangos para condições e decisões.
- Identifique as saídas das decisões como Sim e Não, ou como verdadeiro e falso quando for mais preciso.
- Mostre os caminhos alternativos de if/else.
- Represente repetições, esperas, leituras de sensores e acionamentos relevantes.
- Se existir loop() infinito típico do Arduino, mostre claramente o retorno ao início do ciclo, sem sugerir que o programa termina sozinho.
- Mantenha os textos curtos, em português brasileiro.
- Use identificadores únicos e simples nos nós.
- Use sintaxe Mermaid válida.
- Não use HTML, Markdown externo, imagens, links ou blocos de código dentro de diagram.
- Escape aspas dentro dos rótulos quando necessário.
- Não acrescente explicações fora do JSON.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: instrucao,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2500,
        temperature: 0.1
      }
    });

    const dados = JSON.parse(extrairJson(response.text || ''));

    if (
      typeof dados.diagram !== 'string' ||
      !dados.diagram.trim().startsWith('flowchart')
    ) {
      throw new Error('O modelo não retornou um fluxograma Mermaid válido.');
    }

    // Restringe a saída a texto de fluxograma, evitando diretivas externas.
    if (
      /%%\{|click\s+\w+|https?:\/\/|javascript:|<script|<iframe/i.test(dados.diagram)
    ) {
      throw new Error('O fluxograma retornado contém conteúdo não permitido.');
    }

    return res.json({
      success: true,
      title: String(dados.title || 'Fluxograma do código Arduino').slice(0, 120),
      diagram: dados.diagram
    });
  } catch (erro) {
    console.error('[StartCode] Erro no fluxograma:', erro);

    return res.status(500).json({
      success: false,
      error: 'Não foi possível gerar o fluxograma. Tente novamente.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;
