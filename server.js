<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StartCode - Assistente IA para Codificação</title>
    <link rel="icon" type="image/png" href="/start.png">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b1329] text-gray-100 min-h-screen flex flex-col justify-between">

    <!-- Cabeçalho -->
    <header class="w-full bg-[#0b1329] border-b border-gray-800 py-4 px-6 flex items-center justify-between shadow-md">
        <div class="flex items-center space-x-3">
            <img src="/start.png" alt="Robô Start" class="w-10 h-10 object-contain">
            <h1 class="text-2xl font-bold tracking-wide text-white">StartCode - Assistente IA para Codificação</h1>
        </div>
        <div>
            <img src="/logo.png" alt="Logo Start Maker" class="h-8 object-contain">
        </div>
    </header>

    <!-- Conteúdo Principal -->
    <main class="flex-grow p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Caixa de Entrada (Prompt) -->
        <div class="bg-[#121c3b] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            <div>
                <label class="block text-sm font-semibold text-gray-200 mb-2 flex items-center space-x-2">
                    <span>✏️ Escreva sua ideia aqui</span>
                </label>
                <textarea id="promptInput" rows="8" placeholder="Ex: acenda um led na porta d3 a cada meio segundo..." class="w-full bg-[#070b19] border border-gray-700 rounded-lg p-3 text-gray-100 focus:outline-none focus:border-blue-500 resize-none text-sm"></textarea>
            </div>
            <div class="flex space-x-3 mt-4">
                <button id="btnLimpar" class="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg text-sm transition">Limpar</button>
                <button id="btnGerar" class="flex-grow py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white font-semibold rounded-lg text-sm transition flex items-center justify-center space-x-2 shadow-md">
                    <span>Gerar código com Start IA ⚡</span>
                </button>
            </div>
        </div>

        <!-- Caixa de Código C++ -->
        <div class="bg-[#121c3b] border border-gray-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-semibold text-gray-200 flex items-center space-x-2">
                        <span>💻 Código C++ (Para colar na IDE do Arduino)</span>
                    </label>
                </div>
                <pre id="codeOutput" class="w-full h-52 bg-[#070b19] border border-gray-700 rounded-lg p-3 text-blue-400 font-mono text-xs overflow-auto select-all">// O código gerado aparecerá aqui...</pre>
            </div>
            <div class="flex justify-end mt-4">
                <button id="btnCopiar" class="px-4 py-2 bg-[#00aaee] hover:bg-[#0099dd] text-white font-medium rounded-lg text-xs transition flex items-center space-x-1 shadow">
                    <span>📋 Copiar Código</span>
                </button>
            </div>
        </div>

    </main>

    <!-- Secção de Explicação -->
    <section class="max-w-7xl mx-auto w-full px-6 mb-8">
        <div class="bg-[#121c3b] border border-gray-800 rounded-xl p-5 shadow-lg">
            <h2 class="text-sm font-semibold text-gray-200 mb-2 flex items-center space-x-2">
                <span>💡 Entendendo o código</span>
            </h2>
            <div id="explanationOutput" class="text-xs text-gray-300 leading-relaxed bg-[#070b19] border border-gray-700 rounded-lg p-3 min-h-[60px]">
                A explicação didática do código gerado aparecerá aqui.
            </div>
        </div>
    </section>

    <!-- Rodapé -->
    <footer class="w-full text-center py-4 text-xs text-gray-500 border-t border-gray-800">
        StartCode © 2026 - Start Maker Escola de Robótica
    </footer>

    <!-- Script de Integração com o Servidor -->
    <script>
        const btnGerar = document.getElementById('btnGerar');
        const btnLimpar = document.getElementById('btnLimpar');
        const btnCopiar = document.getElementById('btnCopiar');
        const promptInput = document.getElementById('promptInput');
        const codeOutput = document.getElementById('codeOutput');
        const explanationOutput = document.getElementById('explanationOutput');

        btnGerar.addEventListener('click', async () => {
            const prompt = promptInput.value.trim();
            if (!prompt) return;

            codeOutput.innerText = "// A gerar código com inteligência artificial...";
            explanationOutput.innerHTML = "A processar o pedido...";

            try {
                const response = await fetch('/api/gerar-codigo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });

                const data = await response.json();

                if (data.success) {
                    codeOutput.innerText = data.code;
                    explanationOutput.innerHTML = data.explanation;
                } else {
                    codeOutput.innerText = "// Erro ao gerar código.";
                    explanationOutput.innerHTML = `<span class="text-red-400">${data.error || 'Erro desconhecido'}</span>`;
                }
            } catch (err) {
                console.error(err);
                codeOutput.innerText = "// Erro de conexão com o servidor.";
                explanationOutput.innerHTML = `<span class="text-red-400">Falha na comunicação com a API.</span>`;
            }
        });

        btnLimpar.addEventListener('click', () => {
            promptInput.value = '';
            codeOutput.innerText = '// O código gerado aparecerá aqui...';
            explanationOutput.innerHTML = 'A explicação didática do código gerado aparecerá aqui.';
        });

        btnCopiar.addEventListener('click', () => {
            const textoCodigo = codeOutput.innerText;
            navigator.clipboard.writeText(textoCodigo);
            btnCopiar.innerText = 'Copiado! ✓';
            setTimeout(() => { btnCopiar.innerText = '📋 Copiar Código'; }, 2000);
        });
    </script>
</body>
</html>
