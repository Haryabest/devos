import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Studio' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string;

  @ApiPropertyOptional({ example: 'acme-studio' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug: только строчные, цифры, дефис' })
  @MaxLength(48)
  slug?: string;
}
