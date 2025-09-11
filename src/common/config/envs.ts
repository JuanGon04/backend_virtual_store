import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  ORIGINS_DEV: string[];
  ORIGINS_PROD: string[];
  ENVIRONMENT: string;
  JWT_SECRET: string;
  SWAGGER_USER: string;
  SWAGGER_SECRET: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  CLIENT_GATEWAY_URL_DEV: string;
  CLIENT_GATEWAY_URL_PROD: string;
  FRONTEND_URL_DEV_CHECKOUT_PAYMENT: string;
  FRONTEND_URL_PROD_CHECKOUT_PAYMENT: string;
  FRONTEND_URL_DEV: string;
  FRONTEND_URL_PROD: string;
  WEBHOOK_ID: string;
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
    REDIS_HOST: joi.string().required(),
    REDIS_PORT: joi.number().required(),
    PAYPAL_CLIENT_ID: joi.string().required(),
    PAYPAL_CLIENT_SECRET: joi.string().required(),
    CLIENT_GATEWAY_URL_DEV: joi.string().required(),
    CLIENT_GATEWAY_URL_PROD: joi.string().required(),
    FRONTEND_URL_DEV_CHECKOUT_PAYMENT: joi.string().required(),
    FRONTEND_URL_PROD_CHECKOUT_PAYMENT: joi.string().required(),
    FRONTEND_URL_DEV: joi.string().required(),
    FRONTEND_URL_PROD: joi.string().required(),
    WEBHOOK_ID: joi.string().required(),
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
  redis_host: envVars.REDIS_HOST,
  redis_port: envVars.REDIS_PORT,
  paypal_client_id: envVars.PAYPAL_CLIENT_ID,
  paypal_client_secret: envVars.PAYPAL_CLIENT_SECRET,
  client_gateway_url_dev: envVars.CLIENT_GATEWAY_URL_DEV,
  client_gateway_url_prod: envVars.CLIENT_GATEWAY_URL_PROD,
  frontend_url_prod_checkout_payment:
    envVars.FRONTEND_URL_PROD_CHECKOUT_PAYMENT,
  frontend_url_dev_checkout_payment: envVars.FRONTEND_URL_DEV_CHECKOUT_PAYMENT,
  frontend_url_prod: envVars.FRONTEND_URL_PROD,
  frontend_url_dev: envVars.FRONTEND_URL_DEV,
  webhook_id: envVars.WEBHOOK_ID,
};
