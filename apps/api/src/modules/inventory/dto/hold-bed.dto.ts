import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class HoldBedDto {
  @ApiPropertyOptional({
    description: 'TTL duration in seconds for the temporary hold (default 480 seconds = 8 minutes)',
    example: 480,
    default: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(900)
  ttlSeconds?: number;
}
