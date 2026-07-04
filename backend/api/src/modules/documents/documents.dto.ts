import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, MinLength, IsObject } from 'class-validator';
import type { DocPayloadJson } from './documents.mapper.js';

export class UpsertDocumentDto {
  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  folderId?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ type: Object })
  @IsObject()
  payload!: DocPayloadJson;
}

export class UpdateDocumentDto extends PartialType(UpsertDocumentDto) {}

export class UpsertFolderDto {
  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;
}

export class UpdateFolderDto extends PartialType(UpsertFolderDto) {}
