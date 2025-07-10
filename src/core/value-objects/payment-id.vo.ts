import { EntityId } from './entity-id.vo';

export class PaymentId extends EntityId {
  private constructor(value: string) {
    super(value);
  }

  static create(value?: string): PaymentId {
    return new PaymentId(value || EntityId.generateId());
  }

  static fromString(value: string): PaymentId {
    return new PaymentId(value);
  }
}
