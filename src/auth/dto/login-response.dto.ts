import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/users/user.entity';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenExpires: number;

  @ApiProperty({
    type: () => UserEntity,
  })
  user: UserEntity;
}
