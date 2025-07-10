import { Injectable } from '@nestjs/common';
import { Payment } from '@core/entities/payment.entity';
import { BaseRepository } from './base.repository';
import { IPaymentRepository } from '@core/repositories/payment.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { Payment as PrismaPayment, PaymentType as PrismaPaymentType } from '@prisma/client';
import { PaymentType } from '@core/entities/payment-type.entity';

// Define a type
type PaymentWithPaymentType = PrismaPayment & {
  paymentType: PrismaPaymentType;
};

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Payment | null> {
    return this.executeWithErrorHandling('findById', async () => {
      const paymentRecord = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          paymentType: true,
        },
      });

      if (!paymentRecord) {
        return null;
      }

      return this.mapToModel(paymentRecord as PaymentWithPaymentType);
    });
  }

  async findAll(): Promise<Payment[]> {
    return this.executeWithErrorHandling('findAll', async () => {
      const paymentRecords = await this.prisma.payment.findMany({
        include: {
          paymentType: true,
        },
      });

      return paymentRecords.map(record => this.mapToModel(record as PaymentWithPaymentType));
    });
  }

  private mapToModel(record: PaymentWithPaymentType): Payment {
    const paymentTypeRecord = record.paymentType;

    // Map paymentType first
    const paymentType = PaymentType.fromData({
      id: paymentTypeRecord.id,
      name: paymentTypeRecord.paymentTypeName,
      descriptionPositive: paymentTypeRecord.textPositive,
      descriptionNegative: paymentTypeRecord.textNegative,
    });

    return Payment.fromData({
      id: record.id,
      booked: record.booked,
      amount: Number(record.amount),
      paymentType,
    });
  }
}
