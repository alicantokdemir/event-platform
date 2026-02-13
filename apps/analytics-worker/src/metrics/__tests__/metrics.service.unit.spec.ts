import { MetricsService } from '../metrics.service';
import type { TicketSoldMessage } from '@platform/contracts';

const mockRepo = () => ({
  findProcessedSales: jest.fn(),
  insertProcessedSales: jest.fn(),
  ensureEventMetricsRows: jest.fn(),
  upsertEventTotals: jest.fn(),
  upsertEventChannel: jest.fn(),
  findEventsWithMissingCapacity: jest.fn(),
  updateCapacity: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn(async (fn) => fn({ query: jest.fn() })),
});

describe('MetricsService', () => {
  it('processes a batch and writes aggregates', async () => {
    const repo = mockRepo();
    const dataSource = mockDataSource();
    repo.findProcessedSales.mockResolvedValue(new Set());

    const service = new MetricsService(dataSource as any, repo as any);

    const msg: TicketSoldMessage = {
      sale_id: '11111111-1111-1111-1111-111111111111',
      occurred_at: new Date().toISOString(),
      event_id: '22222222-2222-2222-2222-222222222222',
      ticket_type_id: '33333333-3333-3333-3333-333333333333',
      channel: 'online',
      quantity: 2,
      unit_price_cents: 1000,
      gtv_cents: 2000,
    };

    const result = await service.processBatch([{ msg }]);

    expect(result.eventIds).toEqual([msg.event_id]);
    expect(repo.insertProcessedSales).toHaveBeenCalled();
    expect(repo.upsertEventTotals).toHaveBeenCalled();
    expect(repo.upsertEventChannel).toHaveBeenCalled();
  });
});
