import { Injectable, BadRequestException } from '@nestjs/common';
import { mkdir, writeFile, readFile, unlink, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { env } from '../../config/env.js';

@Injectable()
export class StorageService {
  private minioClient: import('@aws-sdk/client-s3').S3Client | null = null;

  private async s3() {
    if (this.minioClient) return this.minioClient;
    const endpoint = env.S3_ENDPOINT ?? 'http://localhost:9002';
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.minioClient = new S3Client({
      endpoint,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY ?? 'devos',
        secretAccessKey: env.S3_SECRET_KEY ?? 'devos12345',
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
    return this.minioClient;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    if (env.STORAGE_DRIVER === 'LOCAL') {
      const path = join(env.STORAGE_LOCAL_DIR, key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
      return;
    }

    const bucket = env.S3_BUCKET ?? 'devos';
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await this.s3()).send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<{ body: Buffer; size: number }> {
    if (env.STORAGE_DRIVER === 'LOCAL') {
      const path = join(env.STORAGE_LOCAL_DIR, key);
      const body = await readFile(path);
      const info = await stat(path);
      return { body, size: info.size };
    }

    const bucket = env.S3_BUCKET ?? 'devos';
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const res = await (await this.s3()).send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!res.Body) throw new BadRequestException('Файл пуст');
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    return { body, size: body.length };
  }

  async remove(key: string): Promise<void> {
    if (env.STORAGE_DRIVER === 'LOCAL') {
      await unlink(join(env.STORAGE_LOCAL_DIR, key)).catch(() => undefined);
      return;
    }
    const bucket = env.S3_BUCKET ?? 'devos';
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await this.s3()).send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  publicUrl(key: string): string {
    if (env.STORAGE_DRIVER === 'LOCAL') return `/api/files/raw/${encodeURIComponent(key)}`;
    const bucket = env.S3_BUCKET ?? 'devos';
    const base = env.S3_ENDPOINT ?? 'http://localhost:9002';
    return `${base}/${bucket}/${key}`;
  }
}
