import { EntityId } from './entity-id.vo';

export class PaymentTypeId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): PaymentTypeId {
    return new PaymentTypeId(value || EntityId.generateId());
  }

  static fromString(value: string): PaymentTypeId {
    return new PaymentTypeId(value);
  }
}
