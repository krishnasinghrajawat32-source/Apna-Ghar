import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DailyMenu } from '@apna-ghar/shared-types';

export class UpdateWeeklyMenuDto {
  @ApiProperty({
    type: 'array',
    example: [
      {
        day: 'MONDAY',
        breakfast: 'Poha + Jalebi + Tea',
        lunch: 'Dal Tadka + Paneer Butter Masala + Roti + Rice',
        dinner: 'Mix Veg + Dal Makhani + Phulka + Gulab Jamun',
      },
    ],
  })
  @IsArray()
  weeklyMenu!: DailyMenu[];
}
