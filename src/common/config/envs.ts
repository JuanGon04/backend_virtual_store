import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  ORIGINS_DEV: string[];
  ORIGINS_PROD: string[];
  ENVIRONMENT: string;
  FRONTEND_URL_DEV: string;
  FRONTEND_URL_PROD: string;
  JWT_SECRET: string;
  SWAGGER_USER: string;
  SWAGGER_SECRET: string;
}

const envSchema = joi
  .object({
    PORT: joi.number().required(),
    ORIGINS_DEV: joi.array().items(joi.string()).required(),
    ORIGINS_PROD: joi.array().items(joi.string()).required(),
    ENVIRONMENT: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    SWAGGER_SECRET: joi.string().required(),
    SWAGGER_USER: joi.string().required(),
    // FRONTEND_URL_DEV: joi.string().required(),
    // FRONTEND_URL_PROD: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate({
  ...process.env,
  ORIGINS_DEV: process.env.ORIGINS_DEV?.split(','),
  ORIGINS_PROD: process.env.ORIGINS_PROD?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  originsDev: envVars.ORIGINS_DEV,
  originsProd: envVars.ORIGINS_PROD,
  environment: envVars.ENVIRONMENT,
  jwt_secret: envVars.JWT_SECRET,
  swagger_secret: envVars.SWAGGER_SECRET,
  swagger_user: envVars.SWAGGER_USER,
};
