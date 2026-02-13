import { DashboardService } from '../dashboard.service';
import { EventMetricsEntity } from '../domain/metrics/event-metrics.entity';

const mockRepo = () => ({
  getOverview: jest.fn(),
  getChannels: jest.fn(),
});

const mockCache = () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
});

describe('DashboardService', () => {
  it('returns cached overview when present', async () => {
    const repo = mockRepo();
    const cache = mockCache();
    cache.getJson.mockResolvedValue({ cached: true });

    const service = new DashboardService(repo as any, cache as any);
    const result = await service.getOverview('evt-1');

    expect(result).toEqual({ cached: true });
    expect(repo.getOverview).not.toHaveBeenCalled();
  });

  it('computes overview from repository', async () => {
    const repo = mockRepo();
    const cache = mockCache();
    cache.getJson.mockResolvedValue(null);
    repo.getOverview.mockResolvedValue(
      new EventMetricsEntity('evt-1', 1000, 10, 100, new Date())
    );

    const service = new DashboardService(repo as any, cache as any);
    const result = await service.getOverview('evt-1');

    expect(result.gtvCentsTotal).toBe(1000);
    expect(result.ticketsSoldTotal).toBe(10);
    expect(result.capacityTotal).toBe(100);
    expect(result.occupancyPct).toBe(10);
    expect(cache.setJson).toHaveBeenCalled();
  });

  it('returns empty overview when repository has no metrics', async () => {
    const repo = mockRepo();
    const cache = mockCache();
    cache.getJson.mockResolvedValue(null);
    repo.getOverview.mockResolvedValue(null);

    const service = new DashboardService(repo as any, cache as any);
    const result = await service.getOverview('evt-empty');

    expect(result).toEqual({
      eventId: 'evt-empty',
      gtvCentsTotal: 0,
      ticketsSoldTotal: 0,
      capacityTotal: 0,
      occupancyPct: 0,
    });
    expect(cache.setJson).toHaveBeenCalled();
  });
});
