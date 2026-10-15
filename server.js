const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// Rota principal que envia a interface diretamente para o navegador
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt">
        <head>
            <meta charset="UTF-8">
            <title>StartCode - Arduino</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                textarea { width: 100%; height: 100px; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; }
                button { background-color: #4CAF50; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 4px; cursor: pointer; }
                button:hover { background-color: #45a049; }
                pre { background: #eee; padding: 15px; text-align: left; border-radius: 4px; overflow-x: auto; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>StartCode - Gerador para Arduino</h2>
                <p>Escreva o que deseja que o seu robô faça:</p>
                <textarea id="promptInput" placeholder="Ex: Piscar o LED a cada 2 segundos..."></textarea>
                <br>
                <button onclick="gerarCodigo()">Gerar Código</button>
                <pre id="resultado">// O código gerado aparecerá aqui...</pre>
            </div>

            <script>
                async function gerarCodigo() {
                    const prompt = document.getElementById('promptInput').value;
                    const resultadoElement = document.getElementById('resultado');
                    
                    resultadoElement.textContent = "A gerar código...";

                    try {
                        const resposta = await fetch('/api/gerar-codigo', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt })
                        });

                        const dados = await resposta.json();
                        if (dados.success) {
                            resultadoElement.textContent = dados.code;
                        } else {
                            resultadoElement.textContent = "Erro ao gerar código.";
                        }
                    } catch (erro) {
                        resultadoElement.textContent = "Erro de ligação com o servidor.";
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Rota da API para processar o pedido
app.post('/api/gerar-codigo', (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Prompt recebido:", prompt);

        const codigoGerado = `
// Código gerado automaticamente pelo StartCode para: "${prompt || 'Teste'}"
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
        `;

        res.json({ success: true, code: codigoGerado });
    } catch (error) {
        res.status(500).json({ success: false, error: "Erro interno no servidor." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
