import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { IntegrationProvider } from '@prisma/client';

export class IntegrationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: IntegrationProvider })
  provider!: IntegrationProvider;

  @ApiPropertyOptional()
  externalId?: string | null;

  @ApiProperty({ type: [String] })
  scopes!: string[];

  @ApiProperty()
  connected!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ManualTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;
}

export class ConnectUrlResponseDto {
  @ApiProperty()
  url!: string;
}
