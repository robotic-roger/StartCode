const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'frontend')));

app.post('/api/gerar-codigo', (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Prompt recebido:", prompt);

        // Código C++ estruturado para Arduino Uno R4 WiFi
        const codigoGerado = `// StartCode - Projeto: "${prompt || 'Automação Maker'}"
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`;

        // Explicação didática passo a passo para o aluno
        const explicacaoDidatica = `
<strong>🎯 O que este código faz:</strong><br>
Este programa foi desenhado para controlar um atuador (como um LED ou componente integrado) de forma intermitente, permitindo compreender a lógica de repetição e temporização.<br><br>
<strong>📚 Passo a passo para o aluno aprender:</strong><br>
1. <strong>Configuração (setup):</strong> O comando <code>pinMode(LED_BUILTIN, OUTPUT);</code> prepara o pino interno para funcionar como uma saída de energia (para acender luzes ou ativar motores).<br>
2. <strong>Comunicação (Serial):</strong> <code>Serial.begin(9600);</code> abre o canal de comunicação para que o Arduino possa enviar mensagens para o computador.<br>
3. <strong>Ciclo Contínuo (loop):</strong> Tudo o que está aqui dentro repete-se infinitamente.<br>
4. <strong>Ação e Pausa:</strong> <code>digitalWrite(..., HIGH)</code> liga o dispositivo, o <code>delay(1000)</code> faz uma pausa de 1 segundo, e depois o <code>LOW</code> desliga-o por mais 1 segundo.
        `;

        // Passos lógicos estruturados para o fluxograma
        const passosFluxograma = [
            "Início: Ligar o sistema e preparar o Arduino Uno R4",
            "Configuração Inicial (setup): Definir pinos como Saída (OUTPUT)",
            "Iniciar Ciclo Contínuo (loop)?",
            "Ativar Dispositivo (HIGH - Enviar Corrente)",
            "Aguardar Tempo Estipulado (delay de 1 segundo)",
            "Desativar Dispositivo (LOW - Cortar Corrente)",
            "Aguardar Novo Intervalo (delay) antes de reiniciar o ciclo"
        ];

        res.json({ 
            success: true, 
            code: codigoGerado, 
            explanation: explicacaoDidatica,
            flowchart: passosFluxograma
        });
    } catch (error) {
        console.error("Erro no servidor:", error);
        res.status(500).json({ success: false, error: "Erro interno no servidor." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor do StartCode a correr na porta ${PORT}`);
});
