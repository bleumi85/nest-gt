import { PaymentTypeId } from '@core/value-objects/payment-type-id.vo';
import { PaymentTypeName } from '@core/value-objects/payment-type-name.vo';

export class PaymentType {
  private readonly _id: PaymentTypeId;
  private _name: PaymentTypeName;
  private _descriptionPositive: string;
  private _descriptionNegative: string;

  private constructor(
    id: PaymentTypeId,
    name: PaymentTypeName,
    descriptionPositive?: string,
    descriptionNegative?: string,
  ) {
    this._id = id;
    this._name = name;
    this._descriptionPositive = descriptionPositive;
    this._descriptionNegative = descriptionNegative;
  }

  // Factory method
  static fromData(data: {
    id: string;
    name: string;
    descriptionPositive: string;
    descriptionNegative: string;
  }): PaymentType {
    return new PaymentType(
      PaymentTypeId.fromString(data.id),
      new PaymentTypeName(data.name),
      data.descriptionPositive,
      data.descriptionNegative,
    );
  }

  // Getters
  get id(): PaymentTypeId {
    return this._id;
  }

  get name(): PaymentTypeName {
    return this._name;
  }

  get descriptionPositive() {
    return this._descriptionPositive;
  }

  get descriptionNegative() {
    return this._descriptionNegative;
  }
}
