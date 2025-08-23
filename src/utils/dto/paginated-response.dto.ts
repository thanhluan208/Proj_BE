import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}

export class PaginationInfoResponseDto {
  @ApiProperty()
  total: number;
}
