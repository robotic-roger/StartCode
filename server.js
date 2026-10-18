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
        if (!prompt) {
            return res.status(400).json({ success: false, error: "O prompt não pode estar vazio." });
        }

        const promptCompleto = `És o StartCode, um assistente especialista em programação de Arduino para robótica educacional.
O aluno pediu: "${prompt}"

Responde estritamente num formato JSON válido (sem blocos de código markdown ou texto extra, apenas o objeto JSON) contendo exatamente estas duas chaves:
{
  "code": "código C++ completo para Arduino com setup e loop",
  "explanation": "explicação didática detalhada em HTML"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                { role: 'user', parts: [{ text: promptCompleto }] }
            ]
        });

        let textoResposta = response.text.trim();
        if (textoResposta.startsWith("```json")) {
            textoResposta = textoResposta.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (textoResposta.startsWith("```")) {
            textoResposta = textoResposta.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const dados = JSON.parse(textoResposta);

        res.json({
            success: true,
            code: dados.code,
            explanation: dados.explanation
        });

    } catch (erro) {
        console.error("Erro detalhado:", erro);
        res.status(500).json({ success: false, error: "Erro ao gerar o código." });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

module.exports = app;
