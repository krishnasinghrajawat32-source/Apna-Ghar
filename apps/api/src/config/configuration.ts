export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/apnaghar_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_super_secret_access_jwt_key_at_least_32_chars_2026',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_super_secret_refresh_jwt_key_at_least_32_chars_2026',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'dev_cookie_signing_secret_key_change_me',
  },
  inventory: {
    holdTtlSeconds: parseInt(process.env.INVENTORY_HOLD_TTL_SECONDS, 10) || 900,
  },
});
