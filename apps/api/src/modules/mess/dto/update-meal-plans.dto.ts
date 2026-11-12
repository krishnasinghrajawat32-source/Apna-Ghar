import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MealPlanItemDto } from './create-mess.dto';

export class UpdateMealPlansDto {
  @ApiProperty({ type: [MealPlanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealPlanItemDto)
  plans!: MealPlanItemDto[];
}
