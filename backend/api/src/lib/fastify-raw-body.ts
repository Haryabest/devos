import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Readable } from 'node:stream';

export type FastifyRequestWithRawBody = FastifyRequest & { rawBody?: string };

const WEBHOOK_PATH = '/api/integrations/github/webhook';

export function registerGithubWebhookRawBody(fastify: FastifyInstance) {
  fastify.addHook('preParsing', async (request, _reply, payload) => {
    const path = request.url?.split('?')[0];
    if (path !== WEBHOOK_PATH) return payload;

    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks);
    (request as FastifyRequestWithRawBody).rawBody = raw.toString('utf8');

    return Readable.from(raw);
  });
}
