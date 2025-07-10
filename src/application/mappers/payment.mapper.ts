import { Payment } from '@core/entities/payment.entity';
import {
  PaymentDetailResponse,
  PaymentTypeResponse,
} from '@application/dtos/responses/payment.response';
import { PaymentType } from '@core/entities/payment-type.entity';

export class PaymentMapper {
  static toPaymentTypeResponse(paymentType: PaymentType): PaymentTypeResponse {
    return {
      id: paymentType.id.getValue(),
      name: paymentType.name.getValue(),
      descriptionPositive: paymentType.descriptionPositive,
      descriptionNegative: paymentType.descriptionNegative,
    };
  }

  static toDetailResponse(payment: Payment): PaymentDetailResponse {
    return {
      id: payment.id.getValue(),
      booked: payment.booked,
      amount: payment.amount,
      paymentType: this.toPaymentTypeResponse(payment.paymentType),
    };
  }
}
