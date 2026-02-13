import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class DecideApprovalDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], description: 'Keputusan: setujui atau tolak permintaan' })
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Disetujui sesuai kebijakan.', description: 'Catatan dari approver (opsional)' })
  @IsOptional()
  @IsString()
  note?: string;
}
