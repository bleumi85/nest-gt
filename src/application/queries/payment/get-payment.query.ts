import { PaymentDetailResponse } from '@application/dtos/responses/payment.response';
import { PaymentMapper } from '@application/mappers/payment.mapper';
import { EntityNotFoundException } from '@core/exceptions/domain-exceptions';
import { IPaymentRepository } from '@core/repositories/payment.repository.interface';
import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PAYMENT_REPOSITORY } from '@shared/constants/tokens';

export class GetPaymentQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetPaymentQuery)
export class GetPaymentQueryHandler implements IQueryHandler<GetPaymentQuery> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentQuery): Promise<PaymentDetailResponse> {
    const { id } = query;
    const payment = await this.paymentRepository.findById(id);

    if (!payment) {
      throw new EntityNotFoundException('Payment', id);
    }

    // Use the mapper to convert to response DTO
    return PaymentMapper.toDetailResponse(payment);
  }
}
