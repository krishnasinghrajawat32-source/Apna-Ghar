import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsString, IsOptional } from 'class-validator';

export class ComparePropertiesDto {
  @ApiProperty({
    example: ['prop-uuid-1', 'prop-uuid-2'],
    description: 'Array of 2 to 4 Property UUIDs to compare',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Comparison requires at least 2 properties.' })
  @ArrayMaxSize(4, { message: 'Cannot compare more than 4 properties simultaneously.' })
  @IsString({ each: true })
  propertyIds: string[];

  @ApiPropertyOptional({
    example: 'college-uuid-here',
    description: 'Target college ID to measure comparative campus distances',
  })
  @IsOptional()
  @IsString()
  collegeId?: string;
}
