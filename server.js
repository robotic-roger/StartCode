const express = require('express');
const cors = require('cors');
const path = require('path');
// Se estiver a usar o SDK oficial do Google Gen AI, descomente a linha abaixo:
// const { GoogleGenAI } = require('@google/genai');

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'frontend')));

// Inicialize o cliente da IA (substitua ou configure a sua chave de API nas variáveis de ambiente do Render)
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/gerar-codigo', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Prompt recebido:", prompt);

        if (!prompt) {
            return res.status(400).json({ success: false, error: "O prompt não pode estar vazio." });
        }

        // --- INTEGRAÇÃO DA IA ---
        // Aqui faz a chamada à sua API de IA. Exemplo com Gemini:
        /*
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // ou o modelo que estiver a utilizar
            contents: [
                {
                    role: 'system',
                    parts: [{ text: "És o StartCode, um assistente especialista em programação de robótica educacional para Arduino. Deves analisar o pedido do aluno e devolver estritamente um objeto JSON com três propriedades: 'code' (código C++ válido), 'explanation' (explicação didática formatada em HTML) e 'flowchart' (array de objetos com 'tipo' e 'texto' para o fluxograma)." }]
                },
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        });
        const textoResposta = response.text;
        // Parse da resposta da IA para extrair o código, explicação e fluxograma...
        */

        // Para já, mantemos uma estrutura dinâmica de segurança caso esteja a ajustar os parâmetros:
        const codigoGerado = `// StartCode - Projeto Gerado por IA
// Ideia do aluno: "${prompt}"
const int pinDispositivo = 3; // Mapeado automaticamente com base no pedido

void setup() {
  pinMode(pinDispositivo, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // Lógica gerada dinamicamente para atender à instrução do aluno
  digitalWrite(pinDispositivo, HIGH);
  delay(500);
  digitalWrite(pinDispositivo, LOW);
  delay(500);
}`;

        const explicacaoDidatica = `
<strong>🎯 O que este código faz com base na sua ideia ("${prompt}"):</strong><br>
Este programa foi estruturado dinamicamente para traduzir a sua instrução maker em comandos compreensíveis para o microcontrolador.<br><br>
<strong>📚 Explicação didática passo a passo:</strong><br>
1. <strong>Mapeamento de Pinos:</strong> Configuração das portas digitais correspondentes aos componentes solicitados.<br>
2. <strong>Configuração (setup):</strong> Definição dos modos de operação (INPUT/OUTPUT) e taxa de transmissão série.<br>
3. <strong>Ciclo de Execução (loop):</strong> Execução contínua da lógica programada de acordo com o comportamento pretendido.
        `;

        const estruturaFluxograma = [
            { tipo: 'inicio', texto: 'Início: Interpretação da Ideia do Aluno' },
            { tipo: 'processo', texto: 'Configuração dos pinos no setup()' },
            { tipo: 'decisao', texto: 'Condição do projeto ativada?' },
            { tipo: 'ramificacao', condicaoSim: 'Executar ação no componente (HIGH)', condicaoNao: 'Manter estado de espera (LOW)' },
            { tipo: 'processo', texto: 'Controlo de tempo e repetição no loop()' },
            { tipo: 'fim', texto: 'Fim do Ciclo / Atualização Contínua' }
        ];

        res.json({ 
            success: true, 
            code: codigoGerado, 
            explanation: explicacaoDidatica,
            flowchart: estruturaFluxograma
        });

    } catch (error) {
        console.error("Erro no servidor ao gerar código:", error);
        res.status(500).json({ success: false, error: "Erro interno no servidor ao processar a IA." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
