import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitVerificationDto {
  @ApiProperty({ example: 'ELECTRICITY_BILL', description: 'Document type: ELECTRICITY_BILL, SALE_DEED, NOC' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ example: 'kyc/prop_123_electricity_bill.pdf', description: 'Private secure S3 object key' })
  @IsString()
  @IsNotEmpty()
  storageKey: string;
}
