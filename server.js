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

        const promptLower = (prompt || "").toLowerCase();
        
        let codigoGerado = "";
        let explicacaoDidatica = "";
        let estruturaFluxograma = [];

        // Lógica inteligente adaptada ao que o aluno pede
        if (promptLower.includes("botão") || promptLower.includes("botao") || promptLower.includes("porta 5")) {
            codigoGerado = `// StartCode - Projeto: ${prompt}
const int botaoPin = 5; // Porta digital do botão
const int ledPin = 3;   // Porta digital do LED

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(botaoPin, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int estadoBotao = digitalRead(botaoPin);
  
  if (estadoBotao == LOW) { // Botão acionado (GND)
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`;

            explicacaoDidatica = `
<strong>🎯 O que este código faz:</strong><br>
Este programa lê o estado de um botão digital conectado à porta 5 para controlar um LED na porta 3.<br><br>
<strong>📚 Explicação didática passo a passo:</strong><br>
1. <strong>Configuração dos Pinos:</strong> O pino do LED é definido como saída (OUTPUT) e o do botão como entrada com resistência interna (INPUT_PULLUP).<br>
2. <strong>Leitura Contínua (loop):</strong> O microcontrolador verifica constantemente se o botão foi premido.<br>
3. <strong>Ação Condicional:</strong> Se o botão for acionado, o LED acende imediatamente; caso contrário, permanece apagado.
            `;

            estruturaFluxograma = [
                { tipo: 'inicio', texto: 'Início do Sistema' },
                { tipo: 'processo', texto: 'Configurar Pinos (LED no 3, Botão no 5)' },
                { tipo: 'processo', texto: 'Ler estado do botão (digitalRead)' },
                { tipo: 'decisao', texto: 'Botão foi acionado?' },
                { tipo: 'ramificacao', condicaoSim: 'Ligar LED (digitalWrite HIGH)', condicaoNao: 'Apagar LED (digitalWrite LOW)' },
                { tipo: 'fim', texto: 'Repetir Ciclo (loop)' }
            ];
        } else {
            // Comportamento genérico dinâmico baseado na ideia do aluno
            codigoGerado = `// StartCode - Projeto Maker: "${prompt || 'Automação Geral'}"
const int pinoAtuador = 3; 

void setup() {
  pinMode(pinoAtuador, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // Execução baseada na ideia do aluno
  digitalWrite(pinoAtuador, HIGH);
  delay(1000);
  digitalWrite(pinoAtuador, LOW);
  delay(1000);
}`;

            explicacaoDidatica = `
<strong>🎯 O que este código faz para a ideia "${prompt}":</strong><br>
Este código traduz a sua instrução maker para um ciclo de controlo em Arduino.<br><br>
<strong>📚 Explicação didática:</strong><br>
O sistema inicializa a comunicação e gere o acionamento do atuador de forma temporizada e segura.
            `;

            estruturaFluxograma = [
                { tipo: 'inicio', texto: 'Início: Processar Ideia' },
                { tipo: 'processo', texto: 'Configurar pinos no setup()' },
                { tipo: 'decisao', texto: 'Condição ativa?' },
                { tipo: 'ramificacao', condicaoSim: 'Ativar Dispositivo', condicaoNao: 'Aguardar' },
                { tipo: 'fim', texto: 'Fim do Ciclo' }
            ];
        }

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
