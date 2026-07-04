import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpsertWhiteboardDto {
  @ApiProperty({ type: Object })
  @IsObject()
  content!: object;
}
