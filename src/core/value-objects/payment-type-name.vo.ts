import { InvalidValueObjectException } from '@core/exceptions/domain-exceptions';

export class PaymentTypeName {
  private readonly value: string;

  constructor(name: string) {
    if (!this.isValid(name)) {
      throw new InvalidValueObjectException('Invalid paymentTypeName format');
    }
    this.value = this.formatName(name);
  }

  private isValid(name: string): boolean {
    return name && name.trim().length > 0 && name.trim().length <= 50;
  }

  private formatName(name: string): string {
    return name.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(paymentTypeName: PaymentTypeName): boolean {
    return this.value === paymentTypeName.getValue();
  }
}
