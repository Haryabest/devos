import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer/index.js';
import { env } from '../../config/env.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {
    if (env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
      });
    }
  }

  async sendToUser(userId: string, subject: string, text: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user?.email) {
      this.logger.warn(`No email for user ${userId}, skip send`);
      return;
    }
    await this.send(user.email, subject, text);
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter) {
      this.logger.log(`[email stub] to=${to} subject="${subject}"`);
      return;
    }
    await this.transporter.sendMail({
      from: env.SMTP_FROM ?? 'devos@localhost',
      to,
      subject,
      text,
    });
    this.logger.log(`Email sent to ${to}: ${subject}`);
  }
}
