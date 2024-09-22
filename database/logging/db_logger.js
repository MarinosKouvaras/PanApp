const winston = require('winston');


const logger = winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({timestamp, level, message }) => {
            return `${timestamp} - ${level} - ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'sequelize.log' })
    ],
});

module.exports = logger;