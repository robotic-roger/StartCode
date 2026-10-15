const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Forçar o Express a servir diretamente o app.html na raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

// Servir a pasta frontend para os restantes ficheiros
app.use(express.static(path.join(__dirname, 'frontend')));

// Endpoint Dinâmico Universal para qualquer ideia do aluno
app.post('/api/gerar-codigo', (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ erro: 'Por favor, escreva uma ideia para o projeto.' });
    }

    const texto = prompt.toLowerCase();
    const numeros = prompt.match(/\d+/g) || [3, 5];
    const pino1 = numeros[0] !== undefined ? numeros[0] : 3;
    const pino2 = numeros[1] !== undefined ? numeros[1] : 5;

    let codigo = "";
    let explicacao = "";
    let fluxograma = "";

    if (texto.includes('matriz') || texto.includes('coração') || texto.includes('coracao') || texto.includes('desenho')) {
        codigo = `// Código gerado para: ${prompt}
// Compatível com Arduino Uno R4 WiFi
#include "Arduino_LED_Matrix.h"

ArduinoLEDMatrix matrix;

const uint32_t desenho[] = {
  0x01180024,
  0x00004281,
  0x81000000
};

void setup() {
  Serial.begin(9600);
  matrix.begin();
}

void loop() {
  matrix.loadFrame(desenho);
  delay(1000);
  matrix.loadFrame(matrix.zero);
  delay(1000);
}`;
        explicacao = `Este código aciona a Matriz de LEDs integrada no Arduino Uno R4 WiFi para exibir um padrão gráfico personalizado com base no seu pedido ("${prompt}").`;
        fluxograma = `graph TD\nA([Início]) --> B[Inicializar Matriz]\nB --> C[Carregar Padrão Gráfico]\nC --> D[Aguardar 1s]\nD --> E[Apagar Matriz]`;

    } else if (texto.includes('sensor') || texto.includes('temperatura') || texto.includes('luz') || texto.includes('analog') || texto.includes('potenciômetro')) {
        codigo = `// Código gerado para: ${prompt}
// Compatível com Arduino Uno R4 WiFi

const int pinoSensor = A${pino1};
const int pinoAtuador = ${pino2};

void setup() {
  Serial.begin(9600);
  pinMode(pinoAtuador, OUTPUT);
}

void loop() {
  int valor = analogRead(pinoSensor);
  Serial.print("Leitura: ");
  Serial.println(valor);
  
  if (valor > 500) {
    digitalWrite(pinoAtuador, HIGH);
  } else {
    digitalWrite(pinoAtuador, LOW);
  }
  delay(200);
}`;
        explicacao = `Configuração analógica configurada na porta A${pino1} controlando o atuador na porta ${pino2} conforme o limiar de leitura pretendido.`;
        fluxograma = `graph TD\nA([Início]) --> B[Ler Sensor A${pino1}]\nB --> C{Valor > 500?}\nC -- Sim --> D[Ativar Atuador ${pino2}]\nC -- Não --> E[Desativar Atuador]`;

    } else if (texto.includes('servo') || texto.includes('motor') || texto.includes('giro') || texto.includes('rotação')) {
        codigo = `// Código gerado para: ${prompt}
// Compatível com Arduino Uno R4 WiFi
#include <Servo.h>

Servo meuServo;
const int pinoServo = ${pino1};

void setup() {
  Serial.begin(9600);
  meuServo.attach(pinoServo);
}

void loop() {
  meuServo.write(0);
  delay(1000);
  meuServo.write(180);
  delay(1000);
}`;
        explicacao = `Controlo de servo motor na porta ${pino1} programado para alternar a posição entre 0° e 180°.`;
        fluxograma = `graph TD\nA([Início]) --> B[Mover para 0°]\nB --> C[Aguardar 1s]\nC --> D[Mover para 180°]\nD --> E[Aguardar 1s]`;

    } else if (texto.includes('botão') || texto.includes('botao') || texto.includes('led') || texto.includes('porta') || texto.includes('ligar')) {
        codigo = `// Código gerado para: ${prompt}
// Compatível com Arduino Uno R4 WiFi

const int pinoEntrada = ${pino1};
const int pinoSaida = ${pino2};

void setup() {
  Serial.begin(9600);
  pinMode(pinoEntrada, INPUT_PULLUP);
  pinMode(pinoSaida, OUTPUT);
}

void loop() {
  int estado = digitalRead(pinoEntrada);
  
  if (estado == LOW) {
    digitalWrite(pinoSaida, HIGH);
  } else {
    digitalWrite(pinoSaida, LOW);
  }
}`;
        explicacao = `O sistema configurou o pino ${pino1} como entrada de controlo e o pino ${pino2} como saída de sinal digital para atender à sua instrução: "${prompt}".`;
        fluxograma = `graph TD\nA([Início]) --> B[Ler Pino ${pino1}]\nB --> C{Acionado?}\nC -- Sim --> D[Ativar Pino ${pino2}]\nC -- Não --> E[Desativar Pino ${pino2}]`;

    } else {
        codigo = `// Projeto StartCode gerado para: "${prompt}"
// Compatível com Arduino Uno R4 WiFi

const int pinoA = ${pino1};
const int pinoB = ${pino2};

void setup() {
  Serial.begin(9600);
  pinMode(pinoA, INPUT_PULLUP);
  pinMode(pinoB, OUTPUT);
}

void loop() {
  digitalWrite(pinoB, HIGH);
  delay(500);
  digitalWrite(pinoB, LOW);
  delay(500);
}`;
        explicacao = `A Start IA interpretou a sua ideia criativa ("${prompt}") e estruturou este código dinâmico utilizando as portas ${pino1} e ${pino2}.`;
        fluxograma = `graph TD\nA([Início]) --> B[Configurar Portas ${pino1} e ${pino2}]\nB --> C[Executar Rotina Personalizada]\nC --> C`;
    }

    res.json({ codigo, explicacao, fluxograma });
});

app.listen(PORT, () => {
    console.log(`Servidor StartCode universal ativo na porta ${PORT}`);
});