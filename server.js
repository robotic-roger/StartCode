const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'frontend')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/gerar-codigo', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Prompt recebido:", prompt);

        if (!prompt) {
            return res.status(400).json({ success: false, error: "O prompt não pode estar vazio." });
        }

        const systemInstruction = `És o StartCode, um assistente especialista em programação de robótica educacional para Arduino. 
Devolve EXATAMENTE um objeto JSON puro (sem blocos de markdown de código, sem \`\`\`json, apenas o objeto JSON válido) com esta estrutura exata:
{
  "code": "// StartCode - Código C++ gerado para Arduino\\n...",
  "explanation": "<strong>🎯 O que este código faz:</strong><br>...",
  "flowchart": [
    { "tipo": "inicio", "texto": "Início do programa" },
    { "tipo": "processo", "texto": "Configurar portas" },
    { "tipo": "fim", "texto": "Fim" }
  ]
}
REGRAS:
1. Gera código C++ válido para Arduino IDE com setup() e loop().
2. Explicação didática detalhada em HTML.
3. Fluxograma com passos lógicos em array.
4. Responde APENAS com o JSON válido.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                { role: 'user', parts: [{ text: `${systemInstruction}\n\nPedido do aluno: ${prompt}` }] }
            ]
        });

        const respostaTexto = response.text;
        console.log("Resposta bruta:", respostaTexto);

        let jsonLimpo = respostaTexto.trim();
        if (jsonLimpo.startsWith("```json")) {
            jsonLimpo = jsonLimpo.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonLimpo.startsWith("```")) {
            jsonLimpo = jsonLimpo.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const dadosGerados = JSON.parse(jsonLimpo);

        res.json({ 
            success: true, 
            code: dadosGerados.code, 
            explanation: dadosGerados.explanation,
            flowchart: dadosGerados.flowchart
        });

    } catch (error) {
        console.error("Erro no servidor:", error);
        res.status(500).json({ success: false, error: "Erro ao gerar o código com a inteligência artificial." });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;
