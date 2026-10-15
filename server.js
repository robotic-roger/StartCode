const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());

// Servir a pasta frontend com todos os ficheiros estáticos (HTML, CSS, imagens)
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota da API para gerar o código Arduino
app.post('/api/gerar-codigo', (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Prompt recebido:", prompt);

        // Resposta simulada de código C++ para o Arduino Uno R4 WiFi
        const codigoGerado = `// Código gerado pelo StartCode para: "${prompt || 'Projeto'}"
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

        res.json({ success: true, code: codigoGerado });
    } catch (error) {
        console.error("Erro no servidor:", error);
        res.status(500).json({ success: false, error: "Erro interno no servidor." });
    }
});

// Rota coringa para carregar sempre o seu app.html original
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'app.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor do StartCode a correr na porta ${PORT}`);
});
