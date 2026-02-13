import { NotFoundException } from '@nestjs/common';
import { EventsService } from '../events.service';

const mockRepo = () => ({
  listEvents: jest.fn(),
  getEvent: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  listTicketTypes: jest.fn(),
  createTicketType: jest.fn(),
  getTicketType: jest.fn(),
  updateTicketType: jest.fn(),
  deleteTicketType: jest.fn(),
  getAggregate: jest.fn(),
});

const mockSqs = () => ({
  sendJson: jest.fn(),
});

const mockTx = () => ({
  run: jest.fn(async (work: any) => work({})),
});

describe('EventsService', () => {
  it('publishes event.created on create', async () => {
    const repo = mockRepo();
    const sqs = mockSqs();
    const tx = mockTx();
    const created = {
      id: 'evt-1',
      name: 'Test',
      location: 'Here',
      total_capacity: 100,
      sales_channels: ['online'],
      created_at: new Date(),
      updated_at: new Date(),
    };
    repo.createEvent.mockResolvedValue(created);

    const service = new EventsService(repo as any, sqs as any);
    const result = await service.createEvent({
      name: 'Test',
      location: 'Here',
      total_capacity: 100,
      sales_channels: ['online'],
    });

    expect(result).toEqual(created);
    expect(sqs.sendJson).toHaveBeenCalledTimes(1);
  });

  it('throws when ticket type is missing', async () => {
    const repo = mockRepo();
    const sqs = mockSqs();
    const tx = mockTx();
    repo.getTicketType.mockResolvedValue(null);

    const service = new EventsService(repo as any, sqs as any);
    await expect(service.updateTicketType('tt-1', { name: 'VIP' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
