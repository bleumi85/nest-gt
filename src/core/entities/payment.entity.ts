import { AggregateRoot } from '@core/events/domain-event.base';
import { PaymentId } from '@core/value-objects/payment-id.vo';
import { PaymentType } from './payment-type.entity';

export class Payment extends AggregateRoot {
  private readonly _id: PaymentId;
  private _booked: Date;
  private _amount: number;
  private _paymentType: PaymentType;

  private constructor(id: PaymentId, booked: Date, amount: number) {
    super();

    this._id = id;
    this._booked = booked;
    this._amount = amount;
  }

  // Factory method
  static fromData(data: {
    id: string;
    booked: Date;
    amount: number;
    paymentType: PaymentType;
  }): Payment {
    const payment = new Payment(PaymentId.fromString(data.id), data.booked, data.amount);

    payment._paymentType = data.paymentType;

    return payment;
  }

  // Getters
  get id(): PaymentId {
    return this._id;
  }

  get booked(): Date {
    return this._booked;
  }

  get amount(): number {
    return this._amount;
  }

  get paymentType(): PaymentType {
    return this._paymentType;
  }
}
