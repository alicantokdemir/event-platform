import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('/overview')
  async overview(@Query('eventId') eventId?: string) {
    if (!eventId) throw new BadRequestException('eventId is required');
    return this.service.getOverview(eventId);
  }

  @Get('/channels')
  async channels(@Query('eventId') eventId?: string) {
    if (!eventId) throw new BadRequestException('eventId is required');
    return this.service.getChannels(eventId);
  }
}
