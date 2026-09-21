import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseMetaDto {
  @ApiProperty({ example: '2026-09-18T18:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'req_c7a10f92', required: false })
  requestId?: string;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: 'Operation completed successfully.', required: false })
  message?: string;

  @ApiProperty({ type: ApiResponseMetaDto, required: false })
  meta?: ApiResponseMetaDto;
}

export class ApiErrorDetailDto {
  @ApiProperty({ example: 'email', required: false })
  field?: string;

  @ApiProperty({ example: 'email must be a valid email address' })
  issue: string;
}

export class ApiErrorBodyDto {
  @ApiProperty({ example: 'VALIDATION_FAILED' })
  code: string;

  @ApiProperty({ example: 'Invalid input parameters provided.' })
  message: string;

  @ApiProperty({ type: [ApiErrorDetailDto], required: false })
  details?: ApiErrorDetailDto[];
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ type: ApiErrorBodyDto })
  error: ApiErrorBodyDto;

  @ApiProperty({ type: ApiResponseMetaDto, required: false })
  meta?: ApiResponseMetaDto;
}
