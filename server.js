const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'frontend')));

// Inicializa o cliente do Google Gen AI utilizando a variável de ambiente do Render
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/gerar-codigo', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Prompt recebido do aluno:", prompt);

        if (!prompt) {
            return res.status(400).json({ success: false, error: "O prompt não pode estar vazio." });
        }

        // System prompt estrito para forçar a IA a gerar código C++ correto para Arduino com base no pedido livre do aluno
        const systemInstruction = `És o StartCode, um assistente especialista em programação de robótica educacional para Arduino. 
O teu objetivo é ler o pedido do aluno em linguagem natural e gerar estritamente um objeto JSON puro (sem blocos de markdown de código à volta, apenas JSON válido) com a seguinte estrutura exata:
{
  "code": "// StartCode - Código C++ gerado para Arduino\\n...",
  "explanation": "<strong>🎯 O que este código faz:</strong><br>...",
  "flowchart": [
    { "tipo": "inicio", "texto": "..." },
    { "tipo": "processo", "texto": "..." },
    { "tipo": "decisao", "texto": "..." },
    { "tipo": "ramificacao", "condicaoSim": "...", "condicaoNao": "..." },
    { "tipo": "fim", "texto": "..." }
  ]
}
REGRAS CRÍTICAS:
1. Analisa detalhadamente o pedido do aluno (componentes, portas digitais/analógicas, bibliotecas necessárias como Servo.h ou LiquidCrystal, e lógica pretendida).
2. Gera o código C++ válido e estruturado para Arduino IDE (com setup() e loop() corretos).
3. NUNCA utilizes um código padrão de Blink a menos que o aluno o peça expressamente.
4. Garante que o JSON gerado é válido e pronto a ser interpretado por JSON.parse().`;

        // Chamada real ao modelo Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: `${systemInstruction}\n\nPedido do aluno: ${prompt}` }] }
            ]
        });

        const respostaTexto = response.text;
        console.log("Resposta bruta da IA:", respostaTexto);

        // Limpar possíveis formatações de markdown que a IA possa incluir (como ```json ... ```)
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
        console.error("Erro no servidor ao processar com a IA:", error);
        res.status(500).json({ success: false, error: "Erro ao gerar o código com a inteligência artificial." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
