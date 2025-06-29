import { SessionEntity } from 'src/session/session.entity';

export type JwtRefreshPayloadType = {
  sessionId: SessionEntity['id'];
  hash: SessionEntity['hash'];
  iat: number;
  exp: number;
};
