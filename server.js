
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

function limparJson(texto) {
  return texto
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extrairCampo(texto, campo) {
  const marcador = `"${campo}"`;
  const inicioCampo = texto.indexOf(marcador);

  if (inicioCampo === -1) return null;

  const inicioValor = texto.indexOf(':', inicioCampo) + 1;

  let i = inicioValor;

  while (i < texto.length && /\s/.test(texto[i])) i++;

  if (texto[i] !== '"') return null;

  i++;

  let valor = '';
  let escape = false;

  for (; i < texto.length; i++) {
    const caractere = texto[i];

    if (escape) {
      valor += caractere === 'n' ? '\n'
        : caractere === 'r' ? '\r'
        : caractere === 't' ? '\t'
        : caractere;
      escape = false;
    } else if (caractere === '\\') {
      escape = true;
    } else if (caractere === '"') {
      return valor;
    } else {
      valor += caractere;
    }
  }

  return null;
}

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
Você é o StartCode, assistente de programação Arduino para robótica educacional.

Pedido do aluno:
${prompt}

Produza uma resposta em JSON válido, sem Markdown externo, com exatamente:
{
  "code": "código C++ completo para Arduino",
  "explanation": "explicação didática em HTML simples"
}

REGRAS DO CÓDIGO:
- Inclua código completo, com setup() e loop().
- Use a biblioteca apropriada quando necessário.
- Não invente pinos, componentes ou bibliotecas incompatíveis.
- Inclua comentários úteis, sem excesso.
- Se o pedido não informar a placa ou os componentes necessários, explicite as suposições na explicação.
- Não use blocos Markdown dentro do campo code.

REGRAS DA EXPLICAÇÃO:
- Explique o funcionamento em português brasileiro.
- Use HTML simples: p, h3, ul, ol, li, strong, code.
- Explique conexões, funcionamento e como testar quando pertinente.
- Não afirme que o código foi testado fisicamente.
- Seja claro e objetivo.
`;

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    // Envia imediatamente o início da resposta ao navegador.
    res.flushHeaders();

    const enviar = (objeto) => {
      if (!res.writableEnded) {
        res.write(JSON.stringify(objeto) + '\n');
      }
    };

    enviar({ type: 'status', message: 'Gerando código...' });

    let textoCompleto = '';
    let ultimoCodigo = '';
    let ultimoStatus = '';

    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents: promptCompleto,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 3000,
        temperature: 0.2
      }
    });

    for await (const parte of stream) {
      if (res.destroyed) return;

      const texto = parte.text || '';
      if (!texto) continue;

      textoCompleto += texto;

      const codigo = extrairCampo(textoCompleto, 'code');

      if (codigo !== null && codigo !== ultimoCodigo) {
        ultimoCodigo = codigo;
        enviar({ type: 'code', code: codigo });
      }

      const explicacao = extrairCampo(textoCompleto, 'explanation');

      if (explicacao !== null && explicacao !== ultimoStatus) {
        ultimoStatus = explicacao;
        enviar({ type: 'explanation', explanation: explicacao });
      }
    }

    const textoLimpo = limparJson(textoCompleto);
    const resultado = JSON.parse(textoLimpo);

    if (!resultado.code || !resultado.explanation) {
      throw new Error('O Gemini não retornou o código e a explicação esperados.');
    }

    enviar({
      type: 'complete',
      success: true,
      code: resultado.code,
      explanation: resultado.explanation
    });

    console.log(`[StartCode] Modelo: ${MODEL}; tempo total: ${Date.now() - inicio} ms`);

    res.end();
  } catch (erro) {
    console.error('[StartCode] Erro:', erro);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Não foi possível gerar o projeto. Tente novamente.'
      });
    }

    if (!res.destroyed && !res.writableEnded) {
      res.write(JSON.stringify({
        type: 'error',
        error: 'A geração falhou. Tente novamente. Verifique os logs da Vercel para detalhes.'
      }) + '\n');
      res.end();
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;
