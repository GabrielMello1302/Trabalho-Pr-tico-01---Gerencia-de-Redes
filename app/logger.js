const winston = require("winston");

// 1. Iniciamos apenas com o Console (funciona local, no CI e no Render)
const defaultTransports = [
  new winston.transports.Console()
];

// 2. SÓ grava em arquivo se:
// - NÃO for ambiente de teste (Jest)
// - E NÃO estiver rodando dentro do Render (Produção)
if (process.env.NODE_ENV !== 'test' && !process.env.RENDER) {
  defaultTransports.push(
    new winston.transports.File({ filename: '/var/log/app/app.log' })
  );
}

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  transports: defaultTransports
});

module.exports = logger;