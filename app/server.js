const express = require("express");
const cors = require("cors");
const client = require("prom-client");
const winston = require("winston");

const app = express();

app.use(cors());
app.use(express.json());

// =====================================
// CONFIGURAÇÃO DO WINSTON (LOGS EM JSON)
// =====================================
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "logs/app.log" }),
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// =====================================
// PROMETHEUS METRICS
// =====================================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total de requisições HTTP",
    labelNames: ["method", "route", "status"]
});

const httpErrorsTotal = new client.Counter({
    name: "http_errors_total",
    help: "Total de erros HTTP",
    labelNames: ["method", "route", "status"]
});

// Middleware Global de Monitoramento e Log
app.use((req, res, next) => {
    // Intercepta a resposta para contar a métrica com o status correto no final
    res.on("finish", () => {
        httpRequestsTotal.labels(req.method, req.baseUrl + req.path, res.statusCode).inc();
        
        if (res.statusCode >= 400) {
            httpErrorsTotal.labels(req.method, req.baseUrl + req.path, res.statusCode).inc();
        }

        logger.info({
            method: req.method,
            route: req.baseUrl + req.path,
            status: res.statusCode,
            message: `Requisição processada: ${req.method} ${req.url}`
        });
    });
    next();
});

// =====================================
// BANCO DE DADOS EM MEMÓRIA (SIMULADO)
// =====================================
let usuarios = [
    { id: 1, nome: "Gabriel", email: "gabriel@engenharia.com", senha: "123" }
];

// =====================================
// ROTAS OBRIGATÓRIAS (CRUD + LOGIN)
// =====================================

// 1. ROTA PRINCIPAL
app.get("/", (req, res) => {
    res.json({ status: "online", mensagem: "API de Engenharia de Computação Funcional!" });
});

// 2. CADASTRO DE USUÁRIOS (POST /register)
app.post("/register", (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        logger.warn({ route: "/register", message: "Tentativa de cadastro incompleta" });
        return res.status(400).json({ erro: "Todos os campos são obrigatórios" });
    }

    const novoUsuario = { id: usuarios.length + 1, nome, email, senha };
    usuarios.push(novoUsuario);

    logger.info({ route: "/register", action: "user_created", user: email });
    res.status(201).json({ mensagem: "Usuário cadastrado com sucesso", usuario: { id: novoUsuario.id, nome, email } });
});

// 3. LOGIN (POST /login) -> Exigido para monitorar Erros de Login
app.post("/login", (req, res) => {
    const { email, senha } = req.body;

    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (!usuario) {
        logger.error({ 
            route: "/login", 
            event: "login_failed", 
            reason: "invalid_credentials", 
            user_attempted: email 
        });
        return res.status(401).json({ erro: "Credenciais inválidas! Falha no login." });
    }

    logger.info({ route: "/login", event: "login_success", user: email });
    res.json({ mensagem: "Login efetuado com sucesso!", usuario: { nome: usuario.nome, email: usuario.email } });
});

// 4. LISTAR USUÁRIOS (GET /users)
app.get("/users", (req, res) => {
    res.json(usuarios.map(u => ({ id: u.id, nome: u.nome, email: u.email })));
});

// 5. DELETAR USUÁRIO (DELETE /users/:id)
app.delete("/users/:id", (req, res) => {
    const { id } = req.params;
    const index = usuarios.findIndex(u => u.id === parseInt(id));

    if (index === -1) {
        logger.warn({ route: `/users/${id}`, message: "Tentativa de exclusão de usuário inexistente" });
        return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    usuarios.splice(index, 1);
    logger.info({ route: `/users/${id}`, action: "user_deleted" });
    res.json({ mensagem: "Usuário deletado com sucesso" });
});

// =====================================
// ROTAS PARA SIMULAÇÃO DOS INCIDENTES (Parte 4 do PDF)
// =====================================

// INCIDENTE 1: Alta Taxa de Erro (Gera Erro 500 intermitente e quebra)
app.get("/simular-erro", (req, res) => {
    logger.error({
        route: "/simular-erro",
        message: "Erro crítico interno simulado no servidor.",
        code: 500
    });
    res.status(500).json({ erro: "Internal Server Error - Falha Crítica Simulada" });
});

// INCIDENTE 2 e 3: Sobrecarga de CPU (Loop pesado para simular travamento e pico de CPU)
app.get("/simular-sobrecarga", (req, res) => {
    logger.warn({ route: "/simular-sobrecarga", message: "Iniciando processamento pesado de CPU..." });
    
    // Loop pesado artificial para elevar o uso de CPU que o Node Exporter vai pegar
    let rand = 0;
    for (let i = 0; i < 500000000; i++) {
        rand += Math.random();
    }

    res.json({ mensagem: "Processamento concluído", resultado: rand });
});

// =====================================
// ENDPOINT DE MÉTRICAS PROMETHEUS
// =====================================
app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

// =====================================
// INICIALIZAÇÃO
// =====================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Aplicação rodando na porta ${PORT}`);
});
