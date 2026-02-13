import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { z } from 'zod';
import { SqsClient } from './sqs';
import type { TicketSoldMessage } from '@platform/contracts';
import type { Message } from '@aws-sdk/client-sqs';
import { MetricsService } from './metrics/metrics.service';

const TicketSoldSchema = z.object({
  sale_id: z.string().min(1),
  occurred_at: z.string().min(1),
  event_id: z.string().min(1),
  ticket_type_id: z.string().min(1),
  channel: z.enum(['online', 'box_office', 'partners']),
  quantity: z.number().int().positive(),
  unit_price_cents: z.number().int().nonnegative(),
  gtv_cents: z.number().int().nonnegative(),
});

const SQS_POLL_INTERVAL_MS = parseInt(process.env.SQS_POLL_INTERVAL_MS ?? '1000', 10);

@Injectable()
export class Worker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Worker.name);

  private readonly maxPerPoll = parseInt(process.env.SQS_MAX_PER_POLL ?? '10', 10);
  private readonly waitSeconds = parseInt(process.env.SQS_WAIT_SECONDS ?? '20', 10);
  private readonly visibilityTimeout = parseInt(process.env.SQS_VISIBILITY_TIMEOUT ?? '60', 10);
  private readonly batchTarget = parseInt(process.env.BATCH_TARGET ?? '100', 10);
  private readonly batchMaxWaitMs = parseInt(process.env.BATCH_MAX_WAIT_MS ?? '300', 10);

  private inFlight = false;
  private isShuttingDown = false;

  constructor(private readonly metrics: MetricsService, private readonly sqs: SqsClient) {}

  onModuleInit(): void {
    this.logger.log('analytics-worker started');
  }

  onModuleDestroy(): void {
    this.isShuttingDown = true;
  }

  @Interval('sqs-poll', SQS_POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    if (this.isShuttingDown || this.inFlight) return;
    this.inFlight = true;
    try {
      const batch = await this.collectBatch();
      if (batch.messages.length === 0) return;
      const result = await this.metrics.processBatch(batch.parsed.map((p) => ({ msg: p.msg })));
      if (result.eventIds.length > 0) {
        await this.metrics.fillMissingCapacities(result.eventIds);
      }
      await this.sqs.deleteBatch(batch.parsed.map((p) => p.raw));
    } catch (e) {
      this.logger.error('Worker poll error', e as any);
    } finally {
      this.inFlight = false;
    }
  }

  private async collectBatch(): Promise<{ messages: Message[]; parsed: { msg: TicketSoldMessage; raw: Message }[] }> {
    const start = Date.now();
    const messages: Message[] = [];
    const parsed: { msg: TicketSoldMessage; raw: Message }[] = [];

    while (messages.length < this.batchTarget && Date.now() - start < this.batchMaxWaitMs) {
      const chunk = await this.sqs.receive(this.maxPerPoll, this.waitSeconds, this.visibilityTimeout);
      if (chunk.length === 0) break;

      for (const m of chunk) {
        messages.push(m);
        try {
          const body = m.Body ? JSON.parse(m.Body) : null;
          const v = TicketSoldSchema.parse(body);
          parsed.push({ msg: v, raw: m });
        } catch (e) {
          this.logger.warn(`Invalid message; letting it retry/DLQ. Error: ${(e as Error).message}`);
        }
      }
    }
    return { messages, parsed };
  }

}
