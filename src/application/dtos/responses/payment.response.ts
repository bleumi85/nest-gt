import { ApiProperty } from '@nestjs/swagger';

// Basic Payment Type Response dto
export class PaymentTypeResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  descriptionPositive!: string;

  @ApiProperty()
  descriptionNegative!: string;
}

// Basic Payment Response dto
export class PaymentBaseResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty()
  booked!: Date;

  @ApiProperty()
  amount!: number;
}

// Detailed Payment Response with paymentType
export class PaymentDetailResponse extends PaymentBaseResponse {
  @ApiProperty({ type: PaymentTypeResponse })
  paymentType!: PaymentTypeResponse;
}
