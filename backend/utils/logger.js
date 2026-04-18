const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const maskPII = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'api_key', 'apikey', 
    'authorization', 'credential', 'jwt', 'bearer',
    'email', 'phone', 'address', 'latitude', 'longitude',
    'otp', 'delivery_otp', 'razorpay_signature', 'card_number',
    'cvv', 'password_hash', 'hashed'
  ];
  
  const maskValue = (value) => {
    if (typeof value === 'string' && value.length > 4) {
      return value.substring(0, 2) + '***' + value.substring(value.length - 2);
    }
    return '***MASKED***';
  };
  
  try {
    const masked = JSON.parse(JSON.stringify(obj, (key, value) => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        return maskValue(String(value));
      }
      return value;
    }));
    return masked;
  } catch {
    return obj;
  }
};

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0 && metadata._skip !== true) {
    const maskedMeta = maskPII(metadata);
    if (Object.keys(maskedMeta).length > 0) {
      msg += ` ${JSON.stringify(maskedMeta)}`;
    }
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'grocy-mart-api' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5
  }));
}

module.exports = logger;
