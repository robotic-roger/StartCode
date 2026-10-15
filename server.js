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

        const explicacaoDidatica = `
<strong>🎯 O que este código faz:</strong><br>
Este programa controla o funcionamento cíclico de um atuador, permitindo ao aluno entender o fluxo sequencial e o tempo de espera.<br><br>
<strong>📚 Explicação didática passo a passo:</strong><br>
1. <strong>Início e Configuração (setup):</strong> O microcontrolador inicializa os pinos de entrada e saída e abre a comunicação série.<br>
2. <strong>Ciclo Contínuo (loop):</strong> O código entra numa rotina de execução infinita.<br>
3. <strong>Condição de Execução:</strong> O sistema verifica se o comando está ativo para acionar o componente correspondente com segurança.
        `;

        // Estrutura detalhada do fluxograma com blocos de processo e decisão (Sim/Não)
        const estruturaFluxograma = [
            { tipo: 'inicio', texto: 'Início: Ligar o Sistema' },
            { tipo: 'processo', texto: 'Configuração (setup): Definir pinos como Saída (OUTPUT)' },
            { tipo: 'processo', texto: 'Iniciar Ciclo Contínuo (loop)' },
            { tipo: 'decisao', texto: 'Condição ativa / Atraso concluído?' },
            { tipo: 'ramificacao', condicaoSim: 'Ativar Dispositivo (HIGH - Enviar Corrente)', condicaoNao: 'Manter Estado Atual (LOW)' },
            { tipo: 'processo', texto: 'Aguardar Tempo Estipulado (delay)' },
            { tipo: 'fim', texto: 'Fim do Ciclo / Repetir' }
        ];

        res.json({ 
            success: true, 
            code: codigoGerado, 
            explanation: explicacaoDidatica,
            flowchart: estruturaFluxograma
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
    console.log(`Servidor a correr na porta ${PORT}`);
});
