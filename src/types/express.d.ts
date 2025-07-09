import { IJwtRefreshPayload } from '@application/dtos/responses/user.response';

declare module 'express' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Request {
    refreshPayload?: IJwtRefreshPayload;
  }
}
