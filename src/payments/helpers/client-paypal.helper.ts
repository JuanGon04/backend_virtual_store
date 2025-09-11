import { envs } from '@common/config';
import { core } from '@paypal/checkout-server-sdk';

export function buildPayPalClient(): core.PayPalHttpClient {
  const environment = new core.SandboxEnvironment(envs.paypal_client_id, envs.paypal_client_secret);
  return new core.PayPalHttpClient(environment);
}
