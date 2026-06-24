const logger = require('./logger'); // Ajuste o caminho './logger' se estiver em outra pasta

const express = require("express");
const http = require("http"); // Importando o módulo nativo de requisições
const app = express();
app.use(express.json());

/* --- Rotas do App --- */
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
});

app.post("/pedido/novo", (req, res) => {
    logger.info("Status: Pedido Novo recebido.");
    res.status(201).send("Pedido criado");
});

app.put("/pedido/preparando", (req, res) => {
    logger.info("Status: Restaurante preparando o pedido.");
    res.status(200).send("Em preparo");
});

app.put("/pedido/saiu-entrega", (req, res) => {
    logger.info("Status: Motoboy a caminho.");
    res.status(200).send("Saiu para entrega");
});

app.put("/pedido/entregue", (req, res) => {
    logger.info("Status: Pedido entregue com sucesso!");
    res.status(200).send("Entregue");
});

app.post("/pedido/cancelado", (req, res) => {
    logger.info("Status: ERRO - Pedido Cancelado.");
    res.status(400).send("Cancelado");
});

/* --- Inicialização do Servidor --- */
const PORT = process.env.PORT || 3000;

// O if verifica se o arquivo está sendo rodado diretamente (e não num teste automatizado)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`\nServidor de Delivery rodando na porta ${PORT}`);
        logger.info("Iniciando gerador de tráfego automático...\n");
        
        // Inicia o gerador apenas DEPOIS que o servidor ligar
        setInterval(() => {
            const rotas = [
                "/pedido/novo",
                "/pedido/preparando", 
                "/pedido/saiu-entrega", 
                "/pedido/entregue", 
                "/pedido/cancelado"
            ];
            const rotaAleatoria = rotas[Math.floor(Math.random() * rotas.length)];
            const metodo = rotaAleatoria.includes('novo') || rotaAleatoria.includes('cancelado') ? 'POST' : 'PUT';
            
            // Usando 127.0.0.1 para forçar o IPv4 dentro do Docker
            const req = http.request({
                hostname: '127.0.0.1', 
                port: PORT,
                path: rotaAleatoria,
                method: metodo
            }, (res) => {
                // Consome a resposta para não travar a conexão (Memory Leak)
                res.on('data', () => {}); 
            });

            req.on('error', (erro) => {
                logger.info("Erro no gerador: ", erro.message);
            });

            req.end(); // Dispara a requisição
        }, 500);
    });
}

module.exports = app;