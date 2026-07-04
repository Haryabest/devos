import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { FilesService } from './files.service.js';
import { UploadFileQueryDto } from './files.dto.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(
    @Inject(FilesService) private readonly svc: FilesService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  async list(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId: string | undefined,
    @Req() req: FastifyRequest & { userId?: string },
  ) {
    const userId = await this.uid(req);
    return this.svc.list(workspaceId, userId, projectId);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    const q = req.query as UploadFileQueryDto;
    const data = await req.file();
    if (!data) throw new Error('No file');
    const buffer = await data.toBuffer();
    return this.svc.upload(
      q.workspaceId,
      userId,
      { filename: data.filename, mimetype: data.mimetype, buffer },
      { projectId: q.projectId, taskId: q.taskId },
    );
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Req() req: FastifyRequest & { userId?: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const userId = await this.uid(req);
    const { row, body } = await this.svc.download(id, userId);
    res.header('Content-Type', row.mimeType);
    res.header('Content-Disposition', `attachment; filename="${row.name}"`);
    return body;
  }

  @Get('raw/*')
  async raw(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    const key = (req.params as { '*': string })['*'];
    const { body } = await this.svc.getByKey(decodeURIComponent(key), userId);
    return body;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    await this.svc.remove(id, userId);
  }
}
