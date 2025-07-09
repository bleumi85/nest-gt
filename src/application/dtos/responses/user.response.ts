// User response interfaces

export interface IUserRoleResponse {
  id: string;
  name: string;
}

export interface IUserBaseResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}

export interface IUserDetailResponse extends IUserBaseResponse {
  isActive: boolean;
  otpEnabled: boolean;
  lastLoginAt?: Date;
  roles: IUserRoleResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithAuthResponse extends IUserBaseResponse {
  roles: IUserRoleResponse[];
}

export interface IAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: IUserWithAuthResponse;
}

export function isIAuthTokenResponse(response: AuthResponse): response is IAuthTokenResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'accessToken' in response &&
    'refreshToken' in response &&
    'user' in response
  );
}

export interface IOtpRequiredResponse {
  requiresOtp: true;
  userId: string;
  message: string;
}

export interface IEmailVerificationRequiredResponse {
  requiresEmailVerification: true;
  userId: string;
  email: string;
  message: string;
}

export interface IAuthRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  emailVerified?: boolean;
  roles: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface IJwtRefreshPayload {
  sub: string;
  refreshToken: string;
  iat?: number;
  exp?: number;
}

export type AuthResponse =
  | IAuthTokenResponse
  | IOtpRequiredResponse
  | IEmailVerificationRequiredResponse;
