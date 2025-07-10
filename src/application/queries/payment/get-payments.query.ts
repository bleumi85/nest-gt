import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IPaymentRepository } from '@core/repositories/payment.repository.interface';
import { PaymentDetailResponse } from '@application/dtos/responses/payment.response';
import { PaymentMapper } from '@application/mappers/payment.mapper';
import { PAYMENT_REPOSITORY } from '@shared/constants/tokens';

export class GetPaymentsQuery implements IQuery {}

@QueryHandler(GetPaymentsQuery)
export class GetPaymentsQueryHandler implements IQueryHandler<GetPaymentsQuery> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(): Promise<PaymentDetailResponse[]> {
    const payments = await this.paymentRepository.findAll();

    return payments.map(payment => PaymentMapper.toDetailResponse(payment));
  }
}
