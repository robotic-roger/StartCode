
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(express.json({ limit: '20kb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

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
        error: 'O pedido não pode estar vazio.'
      });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'O pedido deve ter no máximo 4000 caracteres.'
      });
    }

    const promptCompleto = `
Você é o StartCode, assistente de programação de Arduino
para robótica educacional.

TAREFA DO ALUNO:
${prompt.trim()}

INSTRUÇÕES:
1. Gere código C++ completo e compilável para Arduino.
2. Inclua setup() e loop().
3. Utilize as portas e os componentes mencionados pelo aluno.
4. Inclua comentários úteis no código.
5. Não invente componentes que não foram solicitados.
6. Na explicação, ensine a função de cada parte do código.
7. A explicação deve ser HTML simples, em português brasileiro.
8. Não coloque Markdown nem cercas de código dentro dos campos.
9. Se o pedido estiver ambíguo e isso impedir um código correto,
   explique a dúvida no campo explanation e solicite esclarecimento
   no lugar de inventar ligações elétricas.

RETORNE SOMENTE UM OBJETO JSON VÁLIDO com estas duas chaves:
{
  "code": "código C++ do Arduino",
  "explanation": "explicação didática em HTML"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptCompleto,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const textoResposta = response.text?.trim();

    if (!textoResposta) {
      throw new Error('A IA retornou uma resposta vazia.');
    }

    const dados = JSON.parse(textoResposta);

    if (
      typeof dados.code !== 'string' ||
      typeof dados.explanation !== 'string'
    ) {
      throw new Error('A IA retornou um formato de resposta inválido.');
    }

    return res.json({
      success: true,
      code: dados.code,
      explanation: dados.explanation
    });

  } catch (erro) {
    console.error('Erro ao gerar código:', {
      message: erro.message,
      status: erro.status,
      name: erro.name
    });

    return res.status(500).json({
      success: false,
      error: 'Não foi possível gerar o código. Tente novamente.'
    });
  }
});

// Fallback para carregar a interface web.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;

// Permite execução local e mantém compatibilidade com a Vercel.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`StartCode disponível na porta ${PORT}`);
  });
}
