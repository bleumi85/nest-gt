import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Controllers
import { PaymentController } from './payment.controller';

// Repositories
import { PAYMENT_REPOSITORY, PERMISSION_REPOSITORY } from '@shared/constants/tokens';
import { PaymentRepository } from '@infrastructure/repositories/payment.repository';
import { PermissionRepository } from '@infrastructure/repositories/permission.repository';

// Services & Modules
import { PermissionService } from '@core/services/permission.service';
import { CoreModule } from '@core/core.module';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';

// Query Handlers
import { GetPaymentsQueryHandler } from '@application/queries/payment/get-payments.query';
import { GetPaymentQueryHandler } from '@application/queries/payment/get-payment.query';

const queryHandlers = [GetPaymentsQueryHandler, GetPaymentQueryHandler];

@Module({
  imports: [CqrsModule, PrismaModule, CoreModule],
  controllers: [PaymentController],
  providers: [
    // Services
    PermissionService,

    // Repository Tokens
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },

    // Query Handlers
    ...queryHandlers,
  ],
})
export class PaymentModule {}
