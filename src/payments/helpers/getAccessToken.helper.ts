import { envs } from '@common/config';
import { logger } from '@common/utils';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisCacheService } from 'src/cache-redis/cache-redis.service';

export async function getPaypalAccessToken(
  cacheServer: RedisCacheService,
  httpService: HttpService,
): Promise<string | null> {
  // primero busca en cache
  let token = await cacheServer.get('paypal_access_token');

  if (token) {
    return token;
  }

  const basicAuth = Buffer.from(
    `${envs.paypal_client_id}:${envs.paypal_client_secret}`,
  ).toString('base64');

  try {
    const { data } = await firstValueFrom(
      httpService.post(
        'https://api-m.sandbox.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
        },
      ),
    );
    token = data.access_token;
    await cacheServer.set('paypal_access_token', token, 28800);
    return token;
  } catch (error) {
    if (error.response) {
      logger(
        'funtion-getPaypalAccessToken',
        `PayPal auth error:', {
        status: ${error.response.status},
      }`,
        error,
        'error',
      );
    }

    return null;
  }
}
