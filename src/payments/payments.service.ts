import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { orders } from '@paypal/checkout-server-sdk';
import { buildPayPalClient } from './helpers/client-paypal.helper';
import { envs } from '@common/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { logger, manejarError } from '@common/utils';
import { HttpService } from '@nestjs/axios';
import { RedisCacheService } from 'src/cache-redis/cache-redis.service';
import { verifySignature } from './helpers';
import { OrdersStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly client = buildPayPalClient();

  private readonly url_backend =
    envs.environment === 'prod'
      ? envs.client_gateway_url_prod
      : envs.client_gateway_url_dev;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly cacheServer: RedisCacheService,
  ) {}

  async createOrder(createPaymentDto: CreatePaymentDto, user_id: string) {
    const { orderId, currency } = createPaymentDto;
    const invoice_id = `ORDER-${Date.now()}`;

    const [user, order] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: user_id },
        select: {
          id: true,
        },
      }),
      this.prisma.orders.findFirst({
        where: {
          id: orderId,
          user_id,
        },
        select: {
          id: true,
          totalAmount: true,
        },
      }),
    ]);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    let response: any;
    try {
      const request = new orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: order.totalAmount,
            },
            invoice_id: invoice_id,
          },
        ],

        application_context: {
          brand_name: 'Virtual Store',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${this.url_backend}/api/payments/return`,
          cancel_url: `${this.url_backend}/api/payments/cancel`,
        },
      });

      response = await this.client.execute(request);
    } catch (err) {
      manejarError(
        err,
        `Error creating payment order ${err}`,
        'PaymentsService-createOrder',
      );
    }

    let payment: any = null;
    if (response.result.id) {
      try {
        payment = await this.prisma.payment.create({
          data: {
            invoice_id,
            payment_id_paypal: response.result.id?.toString() ?? '',
            ordersId: orderId,
            date_created: response.create_time
              ? new Date(response.create_time)
              : new Date(),
          },
        });
      } catch (dbError) {
        // Si falla el guardado del pago
        logger(
          'PaymentsService-createPayment',
          `Error al guardar pago`,
          dbError.message,
          'error',
        );
      }
    }

    try {
      await this.prisma.auditoria.create({
        data: {
          external_reference: invoice_id,
          payment_id_paypal: response.result.id?.toString() ?? '',
          payment_id: payment ? String(payment.id) : '',
          response_created_preference: JSON.stringify(response),
        },
      });
    } catch (auditError) {
      logger(
        'PaymentsService-createPayment',
        `Error al guardar auditoría`,
        auditError.message,
        'error',
      );
    }

    return response.result;
  }

  async updateAudit(
    data_paypal: any,
    token: string | null = null,
    isCanceled = false,
  ) {
    const invoice_id = isCanceled
      ? token
      : data_paypal?.purchase_units?.[0]?.payments?.captures?.[0]?.invoice_id;

    if (!invoice_id) {
      logger(
        'PaymentsService-updateAudit',
        'No se pudo determinar invoice_id',
        null,
        'warn',
      );
      return { received: false };
    }

    const [payment, audit] = await Promise.all([
      this.prisma.payment.findFirst({
        where: {
          OR: [{ invoice_id: invoice_id }, { payment_id_paypal: invoice_id }],
        },
        select: { id: true },
      }),
      this.prisma.auditoria.findFirst({
        where: {
          OR: [
            { external_reference: invoice_id },
            { payment_id_paypal: invoice_id },
          ],
        },
        select: { id: true },
      }),
    ]);

    if (!payment || !audit) {
      logger(
        'PaymentsService-updateAudit',
        `${!payment ? 'Payment' : 'Audit'} with invoice_id: ${invoice_id} not found`,
        null,
        'warn',
      );
      return { received: false };
    }

    try {
      const paymentData = isCanceled
        ? {
            status: 'canceled',
            payer: JSON.stringify(data_paypal),
            payment_method: JSON.stringify(data_paypal),
          }
        : {
            payer: JSON.stringify(data_paypal?.payer || {}),
            payment_method: JSON.stringify(
              data_paypal?.purchase_units?.[0]?.payments?.captures?.[0] || {},
            ),
          };

      await Promise.all([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: paymentData,
        }),
        this.prisma.auditoria.update({
          where: { id: audit.id },
          data: { response_get_payment: JSON.stringify(data_paypal || {}) },
        }),
      ]);

      return { received: true };
    } catch (error) {
      logger(
        'PaymentsService-updateAudit',
        `Error saving the payment return sent by PayPal ${error}`,
        error.message,
        'error',
      );

      throw error;
    }
  }

  async captureOrder(orderId: string) {
    try {
      const request = new orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await this.client.execute(request);

      await this.updateAudit(response.result);

      return response.result.purchase_units[0].payments.captures[0].invoice_id;
    } catch (error: any) {
      if (error.statusCode === 404) {
        logger(
          'PaymentsService-captureOrder',
          `Order with ID ${orderId} not found`,
          error,
          'warn',
        );
        throw error;
      }

      logger(
        'PaymentsService-captureOrder',
        `Unexpected error capturing order ${orderId} ${error}`,
        error,
        'error',
      );
      throw error;
    }
  }

  async changeStatusPayment(
    status: string,
    orderStatus: OrdersStatus,
    body: any,
    verification: any,
  ) {
    const invoice_id = body.resource.invoice_id;
    const [payment, audit] = await Promise.all([
      this.prisma.payment.findFirst({
        where: { invoice_id },
        select: { id: true, ordersId: true },
      }),
      this.prisma.auditoria.findFirst({
        where: { external_reference: invoice_id },
        select: { id: true },
      }),
    ]);

    if (!payment || !audit) {
      logger(
        'PaymentsService-updateAudit',
        `${!payment ? 'Payment' : 'Audit'} with invoice_id: ${invoice_id} not found`,
        null,
        'warn',
      );
      return { received: false };
    }

    const order = await this.prisma.orders.findFirst({
      where: { id: payment.ordersId },
      select: { id: true },
    });

    if (!order) {
      logger(
        'PaymentsService-updateAudit',
        `Order with invoice_id: ${invoice_id} not found`,
        null,
        'warn',
      );
      return { received: false };
    }

    const orderData =
      orderStatus === 'COMPLETED'
        ? {
            status: orderStatus,
            paid: true,
            paidAt: new Date(),
          }
        : {
            status: orderStatus,
          };

    try {
      await Promise.all([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status,
          },
        }),
        this.prisma.auditoria.update({
          where: { id: audit.id },
          data: {
            resquested_webhook: JSON.stringify(body || {}),
            response_get_payment: JSON.stringify(verification || {}),
          },
        }),
        this.prisma.orders.update({
          where: { id: order.id },
          data: orderData,
        }),
      ]);

      await this.cacheServer.delByPattern(`orders:user:*`);

      return { received: true };
    } catch (error) {
      logger(
        'PaymentsService-changeStatusPayment',
        `Error saving the payment return sent by PayPal webhook ${error}`,
        error.message,
        'error',
      );

      throw error;
    }
  }

  async webhook(verifyBody: any, body: any) {
    const verification = await verifySignature(
      verifyBody,
      this.httpService,
      this.cacheServer,
    );

    if (verification.verification_status !== 'SUCCESS') {
      return { ok: false, reason: 'invalid-signature' };
    }

    const eventType = body.event_type;

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Pago confirmado
        await this.changeStatusPayment(
          'aproved',
          OrdersStatus.COMPLETED,
          body,
          verification,
        );
        break;

      case 'PAYMENT.CAPTURE.PENDING':
        await this.changeStatusPayment(
          'pending',
          OrdersStatus.PENDING,
          body,
          verification,
        );
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await this.changeStatusPayment(
          'canceled',
          OrdersStatus.CANCELED,
          body,
          verification,
        );
        break;
    }

    return { ok: true };
  }
}
