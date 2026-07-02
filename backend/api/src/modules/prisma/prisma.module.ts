import { Global, Module, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
});

@Global()
@Module({
  providers: [{ provide: PrismaClient, useValue: prisma }],
  exports: [PrismaClient],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await prisma.$disconnect();
  }
}
