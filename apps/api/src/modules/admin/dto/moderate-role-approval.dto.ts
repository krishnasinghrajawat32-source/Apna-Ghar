import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RoleApprovalStatus } from '@apna-ghar/shared-types';

export class ModerateRoleApprovalDto {
  @ApiProperty({ enum: RoleApprovalStatus, example: RoleApprovalStatus.APPROVED })
  @IsEnum(RoleApprovalStatus)
  @IsNotEmpty()
  status!: RoleApprovalStatus;

  @ApiProperty({ required: false, example: 'Business documentation verified.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
