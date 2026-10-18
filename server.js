
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

function parseJson(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  return JSON.parse(cleaned);
}

app.post('/api/gerar-codigo', async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Descreva o projeto Arduino.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY não está configurada na Vercel.'
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Você é o StartCode, especialista em Arduino.
Crie um código Arduino completo para este pedido: ${prompt}

Retorne somente JSON válido:
{
  "code": "código C++ completo",
  "explanation": "explicação didática em HTML"
}

Inclua setup() e loop(). Explique as suposições sobre componentes e pinos.
Não afirme que o código foi testado fisicamente.`,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 3000,
        temperature: 0.2
      }
    });

    const data = parseJson(response.text);

    if (
      typeof data.code !== 'string' ||
      typeof data.explanation !== 'string' ||
      !data.code.trim()
    ) {
      throw new Error('A resposta do modelo não contém os campos esperados.');
    }

    res.json({
      success: true,
      code: data.code,
      explanation: data.explanation
    });
  } catch (error) {
    console.error('[StartCode][codigo]', error);

    res.status(500).json({
      success: false,
      error: 'Falha ao gerar o código Arduino. Consulte os logs da Vercel.'
    });
  }
});

app.post('/api/gerar-fluxograma', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim();

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum código Arduino foi recebido.'
      });
    }

    if (code.length > 20000) {
      return res.status(413).json({
        success: false,
        error: 'O código ultrapassa o limite de 20.000 caracteres.'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY não está configurada na Vercel.'
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Analise o código Arduino e produza um fluxograma Mermaid válido.

CÓDIGO:
${code}

Retorne exclusivamente JSON válido:
{
  "title": "Fluxograma do programa Arduino",
  "diagram": "flowchart TD\\nA([Início]) --> B[Inicializar]"
}

Regras:
- diagram deve começar com flowchart TD.
- Use identificadores simples: A, B, C, D...
- Use [Texto] para processos.
- Use {Condição?} para decisões.
- Use ([Início]) e ([Fim]) para terminais quando apropriado.
- Represente setup(), loop(), condições if/else, leituras, esperas e acionamentos importantes.
- Em decisões, escreva os rótulos das ligações com Sim e Não.
- Mostre o retorno do loop contínuo do Arduino.
- Use textos curtos em português.
- Não inclua blocos Markdown, HTML, links, diretivas Mermaid ou explicações externas.
- Garanta que todas as ligações apontem para identificadores existentes.
- Não invente comportamentos que não estejam no código.`,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 2500,
        temperature: 0.1
      }
    });

    const data = parseJson(response.text);
    const diagram = String(data.diagram || '').trim();

    if (!/^flowchart\s+(TD|TB|LR|RL|BT)\b/i.test(diagram)) {
      throw new Error('O modelo retornou um diagrama sem a declaração flowchart válida.');
    }

    if (
      /<script|<iframe|javascript:|%%\{|^\s*click\s+/im.test(diagram)
    ) {
      throw new Error('O diagrama contém conteúdo não permitido.');
    }

    console.log('[StartCode][fluxograma] Diagrama recebido:', diagram.length, 'caracteres');

    res.json({
      success: true,
      title: String(data.title || 'Fluxograma do código Arduino').slice(0, 120),
      diagram
    });
  } catch (error) {
    console.error('[StartCode][fluxograma]', error);

    res.status(500).json({
      success: false,
      error: 'A IA não conseguiu produzir o fluxograma. Consulte os logs da Vercel para identificar a causa.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;
