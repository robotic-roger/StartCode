
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(express.json({ limit: '20kb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mantém o modelo que já estava funcionando no projeto.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.post('/api/gerar-codigo', async (req, res) => {
  try {
    if (!ai) {
      console.error('GEMINI_API_KEY não configurada.');
      return res.status(500).json({
        success: false,
        error: 'A configuração da inteligência artificial está incompleta.'
      });
    }

    const prompt = req.body?.prompt;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Escreva o que você deseja programar.'
      });
    }

    const pedido = prompt.trim();

    if (pedido.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'O pedido deve ter no máximo 4000 caracteres.'
      });
    }

    const promptCompleto = `
Você é o StartCode, assistente de programação Arduino
para robótica educacional. Responda em português brasileiro.

PEDIDO DO ALUNO:
${pedido}

INSTRUÇÕES:
1. Gere código C++ completo para Arduino, com setup() e loop().
2. Utilize as portas e os componentes mencionados pelo aluno.
3. Não invente componentes nem ligações elétricas.
4. Inclua comentários úteis no código.
5. Explique didaticamente o funcionamento do código em HTML simples.
6. Seja objetivo, mas explique as funções, portas e tempos importantes.
7. Se faltar informação indispensável, explique a dúvida e peça esclarecimento.
8. Retorne apenas JSON válido, sem Markdown ou texto fora do objeto.

Formato obrigatório:
{
  "code": "código C++ completo",
  "explanation": "explicação didática em HTML"
}
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: promptCompleto,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2500
      }
    });

    const texto = response.text?.trim();

    if (!texto) {
      return res.status(502).json({
        success: false,
        error: 'A inteligência artificial retornou uma resposta vazia. Tente novamente.'
      });
    }

    let dados;

    try {
      dados = JSON.parse(texto);
    } catch {
      const textoLimpo = texto
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      dados = JSON.parse(textoLimpo);
    }

    if (
      !dados ||
      typeof dados.code !== 'string' ||
      typeof dados.explanation !== 'string' ||
      !dados.code.trim() ||
      !dados.explanation.trim()
    ) {
      return res.status(502).json({
        success: false,
        error: 'A resposta gerada está incompleta. Tente novamente.'
      });
    }

    return res.json({
      success: true,
      code: dados.code.trim(),
      explanation: dados.explanation.trim()
    });

  } catch (erro) {
    console.error('Erro ao gerar código:', {
      message: erro?.message,
      status: erro?.status,
      name: erro?.name
    });

    if (Number(erro?.status) === 429) {
      return res.status(429).json({
        success: false,
        error: 'O serviço está ocupado. Aguarde um pouco e tente novamente.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Não foi possível gerar o código agora. Tente novamente em instantes.'
    });
  }
});

// Carrega a interface web.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;

// Permite executar localmente e mantém o suporte à Vercel.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`StartCode disponível na porta ${PORT}`);
  });
}
