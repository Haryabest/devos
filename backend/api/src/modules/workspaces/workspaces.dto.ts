import { IsString, IsOptional, MinLength, MaxLength, Matches, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

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

export class InviteMemberDto {
  @ApiProperty({ example: 'dev@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole, example: 'DEVELOPER' })
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: WorkspaceRole })
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
