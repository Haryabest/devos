import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  kind!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  body?: string | null;

  @ApiPropertyOptional()
  data?: Record<string, unknown> | null;

  @ApiProperty()
  read!: boolean;

  @ApiProperty()
  createdAt!: string;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count!: number;
}

export class CreateNotificationDto {
  @ApiProperty()
  kind!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  body?: string;

  @ApiPropertyOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional()
  sendEmail?: boolean;
}
