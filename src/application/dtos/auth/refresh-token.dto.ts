import {
  isJWT,
  isUUID,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function IsUUIDOrJWT(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUUIDOrJWT',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isUUID(value) || isJWT(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Value must be a valid UUID or JWT';
        },
      },
    });
  };
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
  })
  @IsUUIDOrJWT()
  refreshToken!: string;
}
