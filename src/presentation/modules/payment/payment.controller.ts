import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

// Guards & Decorators
import { PermissionsV2Guard } from '@presentation/guards/permissions.v2.guard';
import { RequirePermissions } from '@shared/decorators/permissions.decorator';
//import { CanWrite } from '@shared/decorators/resource-permissions.decorator';
import { RequiresAdmin } from '@shared/decorators/admin.decorator';

// Queries
import { GetPaymentsQuery } from '@application/queries/payment/get-payments.query';
import { GetPaymentQuery } from '@application/queries/payment/get-payment.query';

@ApiTags('payments')
@Controller('payments')
@UseGuards(PermissionsV2Guard)
@RequirePermissions('payment:read')
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @RequiresAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of all payments' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have admin role' })
  async getAllPayments() {
    return this.queryBus.execute(new GetPaymentsQuery());
  }

  @Get(':id')
  @RequiresAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment by ID (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns payment information' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Payment not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'User does not have admin role' })
  async getPaymentById(@Param('id') id: string) {
    return this.queryBus.execute(new GetPaymentQuery(id));
  }
}
