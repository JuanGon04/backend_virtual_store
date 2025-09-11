import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisCacheService } from 'src/cache-redis/cache-redis.service';
import { getPaypalAccessToken } from './getAccessToken.helper';
import { logger } from '@common/utils';

export async function verifySignature(
    verifyBody: any,
  httpService: HttpService,
  cacheServer: RedisCacheService,
){

  const accessToken = await getPaypalAccessToken(cacheServer, httpService);
  try {
    const verifyUrl =
      'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature';

    const { data } = await firstValueFrom(
      httpService.post(verifyUrl, verifyBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    );
    return data;
  } catch {
    await cacheServer.del('paypal_access_token');
    console.warn('Auth inválido, regenerando...');

    const newAccessToken = await getPaypalAccessToken(cacheServer, httpService);
    try {
      const { data } = await firstValueFrom(
        httpService.post(
          'https://api-m.sandbox.paypal.com/v1/oauth2/token',
          'grant_type=client_credentials',
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${newAccessToken}`,
            },
          },
        ),
      );
      return data;
    } catch (error) {
        await cacheServer.del('paypal_access_token');
      if (error.response) {
        logger(
          'funtion-verifySignature',
          `PayPal auth error:', {
            status: ${error.response.status},
            message: ${error.response.data},
          }`,
          error,
          'error',
        );
      }
      return null;
    }
  }
}
