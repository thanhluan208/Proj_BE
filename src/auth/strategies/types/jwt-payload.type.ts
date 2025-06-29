import { SessionEntity } from 'src/session/session.entity';
import { UserEntity } from 'src/users/user.entity';

export type JwtPayloadType = Pick<UserEntity, 'id' | 'role'> & {
  sessionId: SessionEntity['id'];
  iat: number;
  exp: number;
};
