import { IsEnum, IsBoolean, IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoommatePreferencesDto {
  @ApiProperty({ enum: ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'], example: 'NIGHT_OWL' })
  @IsEnum(['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE'])
  @IsOptional()
  sleepSchedule?: 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE';

  @ApiProperty({ enum: ['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN', 'ANY'], example: 'VEG' })
  @IsEnum(['VEG', 'NON_VEG', 'VEGAN', 'EGGETARIAN', 'ANY'])
  @IsOptional()
  foodPreference?: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGGETARIAN' | 'ANY';

  @ApiProperty({ enum: ['STRICT', 'MODERATE', 'CASUAL'], example: 'MODERATE' })
  @IsEnum(['STRICT', 'MODERATE', 'CASUAL'])
  @IsOptional()
  cleanlinessLevel?: 'STRICT' | 'MODERATE' | 'CASUAL';

  @ApiProperty({ enum: ['SILENT', 'GROUP', 'MUSIC_OK'], example: 'SILENT' })
  @IsEnum(['SILENT', 'GROUP', 'MUSIC_OK'])
  @IsOptional()
  studyHabits?: 'SILENT' | 'GROUP' | 'MUSIC_OK';

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  smoking?: boolean;

  @ApiProperty({ type: [String], example: ['Coding', 'Music', 'Chess'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hobbies?: string[];
}
