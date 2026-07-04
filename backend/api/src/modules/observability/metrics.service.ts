import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry, prefix: 'devos_' });
  }

  async snapshot() {
    return this.registry.metrics();
  }
}
