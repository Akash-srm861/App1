require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5050,
  JWT_SECRET: process.env.JWT_SECRET || 'code_the_output_secret_key_2026_super_secure_key',
  JUDGE0_API_URL: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  JUDGE0_API_KEY: process.env.JUDGE0_API_KEY || '',
  JUDGE0_HOST: process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com',
  EXECUTION_PROVIDER: process.env.EXECUTION_PROVIDER || 'judge0',
  DEFAULT_DURATION_SECONDS: parseInt(process.env.DEFAULT_DURATION_SECONDS || '600', 10),
};
