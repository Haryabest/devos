import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export type AiContextKind = 'general' | 'document' | 'task' | 'roadmap' | 'whiteboard' | 'project';

export class AiAskDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  question!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ enum: ['general', 'document', 'task', 'roadmap', 'whiteboard', 'project'] })
  @IsOptional()
  @IsEnum(['general', 'document', 'task', 'roadmap', 'whiteboard', 'project'])
  context?: AiContextKind;
}

export class AiGenerateTasksDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  prompt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;
}

export class AiDocumentAssistDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  instruction!: string;

  @ApiProperty()
  @IsString()
  content!: string;
}

export class AiRoadmapSuggestDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  prompt!: string;
}

export class AiWhiteboardSuggestDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  prompt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  boardContent?: unknown;
}

export class AiAnalyzeProjectDto {
  @ApiProperty()
  @IsString()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  projectId!: string;
}

export class AiMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: string;
}

export class AiConversationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [AiMessageResponseDto] })
  messages!: AiMessageResponseDto[];
}

export class AiHealthScoreResponseDto {
  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  score!: number;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ type: [String] })
  risks!: string[];

  @ApiProperty({ type: [String] })
  recommendations!: string[];
}
