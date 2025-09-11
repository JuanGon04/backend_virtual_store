import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Res,
  Redirect,
  HttpException,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { User } from '@common/decorators';
import { CurrentUser } from '@common/interfaces';
import { AuthGuard } from '@common/guards';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { envs } from '@common/config';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  //Frontend URL return paypal
  private readonly url_frontend_checkout_payment =
    envs.environment === 'prod'
      ? envs.frontend_url_prod_checkout_payment
      : envs.frontend_url_dev_checkout_payment;

  //General frontend URL
  private readonly url_frontend =
    envs.environment === 'prod'
      ? envs.frontend_url_prod
      : envs.frontend_url_dev;

  @UseGuards(AuthGuard)
  @Post('create-payment')
  @ApiCookieAuth('jwt')
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({
    status: 201,
    description: `{
    "id": "id_payment",
    "links": [
        {
            "href": "https://api.sandbox.paypal.com/v2/checkout/orders/id_payment",
            "rel": "self",
            "method": "GET"
        },
        {
            "href": "https://www.sandbox.paypal.com/checkoutnow?token=id_payment",
            "rel": "approve",
            "method": "GET"
        },
        {
            "href": "https://api.sandbox.paypal.com/v2/checkout/orders/id_payment",
            "rel": "update",
            "method": "PATCH"
        },
        {
            "href": "https://api.sandbox.paypal.com/v2/checkout/orders/id_payment/capture",
            "rel": "capture",
            "method": "POST"
        }
    ]
}`,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 404, description: 'order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 401, description: 'Expired or invalid token' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async createOrder(
    @Body() createPaymentDto: CreatePaymentDto,
    @User() user: CurrentUser,
  ) {
    const order = await this.paymentsService.createOrder(
      createPaymentDto,
      user.id,
    );

    return {
      id: order.id,
      links: order.links,
    };
  }

  // Ruta que PayPal redirige tras aprobar
  @ApiOperation({ summary: 'Return endpoint when payment is successful' })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiQuery({ name: 'PayerID', required: true, type: String })
  @ApiResponse({ status: 400, description: 'token or PayerID are requerid' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend URL',
  })
  @Get('return')
  @Redirect()
  async return(
    @Query('token') token: string,
    @Query('PayerID') payerId: string,
    @Res() res: Response,
  ) {
    if (!token || !payerId) {
      throw new HttpException('token or PayerID are requerid', 400);
    }

    try {
      const capture = await this.paymentsService.captureOrder(token);

      return {
        url: `${this.url_frontend_checkout_payment}${capture}`,
        statusCode: 302,
      };
    } catch {
      return {
        url: `${this.url_frontend}/error`,
        statusCode: 302,
      };
    }
  }

  @ApiOperation({ summary: 'Return endpoint when payment is cancel' })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend URL',
  })
  @Get('cancel')
  @Redirect()
  async cancel(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      throw new HttpException('token is requerid', 400);
    }

    try {
      await this.paymentsService.updateAudit('ORDER_NOT_APPROVED', token, true);

      return {
        url: `${this.url_frontend_checkout_payment}${token}`,
        statusCode: 302,
      };
    } catch {
      return {
        url: `${this.url_frontend}/error`,
        statusCode: 302,
      };
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Req() req: any
  ) {
    
  const headers = req.headers;

  const verifyBody = {
    auth_algo: headers['paypal-auth-algo'] as string,
    cert_url: headers['paypal-cert-url'] as string,
    transmission_id: headers['paypal-transmission-id'] as string,
    transmission_sig: headers['paypal-transmission-sig'] as string,
    transmission_time: headers['paypal-transmission-time'] as string,
    webhook_id: envs.webhook_id, // tu webhook_id correcto de sandbox o prod
    webhook_event: body,
  };

  if (!verifyBody.transmission_sig) {
    return { received: false, reason: 'no-signature' };
  }

    return await this.paymentsService.webhook(verifyBody, body);
  }
}
