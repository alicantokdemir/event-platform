import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { Cache } from './cache';
import { EventMetricsAggregate } from './domain/metrics/event-metrics.aggregate';

@Injectable()
export class DashboardService {
  constructor(private readonly repo: AnalyticsRepository, private readonly cache: Cache) {}

  async getOverview(eventId: string) {
    const key = `dash:overview:${eventId}`;
    const cached = await this.cache.getJson<any>(key);
    if (cached) return cached;

    const metrics = await this.repo.getOverview(eventId);
    const result = metrics
      ? {
          eventId,
          gtvCentsTotal: metrics.gtvCentsTotal,
          ticketsSoldTotal: metrics.ticketsSoldTotal,
          capacityTotal: metrics.capacityTotal,
          occupancyPct: Number(new EventMetricsAggregate(metrics, []).occupancyPct().toFixed(2)),
        }
      : {
          eventId,
          gtvCentsTotal: 0,
          ticketsSoldTotal: 0,
          capacityTotal: 0,
          occupancyPct: 0,
        };

    await this.cache.setJson(key, result, parseInt(process.env.CACHE_TTL_SECONDS ?? '15', 10));
    return result;
  }

  async getChannels(eventId: string) {
    const key = `dash:channels:${eventId}`;
    const cached = await this.cache.getJson<any>(key);
    if (cached) return cached;

    const rows = await this.repo.getChannels(eventId);
    const result = rows.map((r) => ({
      channel: r.channel,
      gtvCents: r.gtvCents,
      ticketsSold: r.ticketsSold,
    }));

    await this.cache.setJson(key, result, parseInt(process.env.CACHE_TTL_SECONDS ?? '15', 10));
    return result;
  }
}
