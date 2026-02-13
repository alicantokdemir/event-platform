import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  CreateEventSchema,
  UpdateEventSchema,
  CreateTicketTypeSchema,
  UpdateTicketTypeSchema,
} from '@platform/contracts';

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get('/events')
  async listEvents() {
    return this.events.listEvents();
  }

  @Get('/events/:id')
  async getEvent(@Param('id') id: string) {
    return this.events.getEvent(id);
  }

  @Post('/events')
  async createEvent(@Body() body: unknown) {
    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.events.createEvent(parsed.data);
  }

  @Put('/events/:id')
  async updateEvent(@Param('id') id: string, @Body() body: unknown) {
    const parsed = UpdateEventSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.events.updateEvent(id, parsed.data);
  }

  @Delete('/events/:id')
  async deleteEvent(@Param('id') id: string) {
    await this.events.deleteEvent(id);
    return { deleted: true };
  }

  @Get('/events/:id/ticket-types')
  async listTicketTypes(@Param('id') eventId: string) {
    return this.events.listTicketTypes(eventId);
  }

  @Post('/events/:id/ticket-types')
  async createTicketType(@Param('id') eventId: string, @Body() body: unknown) {
    const parsed = CreateTicketTypeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.events.createTicketType(eventId, parsed.data);
  }

  @Put('/ticket-types/:id')
  async updateTicketType(@Param('id') id: string, @Body() body: unknown) {
    const parsed = UpdateTicketTypeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.events.updateTicketType(id, parsed.data);
  }

  @Get('/ticket-types/:id')
  async getTicketType(@Param('id') id: string) {
    return this.events.getTicketType(id);
  }

  @Delete('/ticket-types/:id')
  async deleteTicketType(@Param('id') id: string) {
    await this.events.deleteTicketType(id);
    return { deleted: true };
  }

  // optional endpoint: capacity snapshot for analytics-worker
  @Get('/internal/event-capacity')
  async capacity(@Query('eventId') eventId?: string) {
    if (!eventId) throw new BadRequestException('eventId is required');
    const evt = await this.events.getEvent(eventId);
    return { event_id: eventId, capacity_total: evt.total_capacity };
  }
}
