import { Payment } from '../entities/payment.entity';

/**
 * Role repository interface
 *
 * Implementations:
 * - {@link PaymentRepository} - Production Prisma/PostgreSQL implementation
 */
export interface IPaymentRepository {
  findAll(): Promise<Payment[]>;
  findById(id: string): Promise<Payment | null>;
}
