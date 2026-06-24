const winston = require("winston");

// 1. Criamos a lista de transports começando apenas com o Console
const defaultTransports = [
  new winston.transports.Console()
];

// 2. Se NÃO for o ambiente de testes do GitHub Actions/Jest, adicionamos o arquivo
if (process.env.NODE_ENV !== 'test') {
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

  // 3. Passamos a nossa lista dinâmica aqui para o Winston
  transports: defaultTransports
});

module.exports = logger;