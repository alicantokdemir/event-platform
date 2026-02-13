import { z } from 'zod';

export type SalesChannel = 'online' | 'box_office' | 'partners';
export type TicketKind = 'FULL' | 'HALF';

export const SalesChannelSchema = z.enum(['online', 'box_office', 'partners']);
export const TicketKindSchema = z.enum(['FULL', 'HALF']);

export const CreateEventSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  total_capacity: z.number().int().nonnegative(),
  sales_channels: z.array(SalesChannelSchema).min(1),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const CreateTicketTypeSchema = z.object({
  name: z.string().min(1),
  kind: TicketKindSchema,
  price_cents: z.number().int().nonnegative(),
  capacity: z.number().int().nonnegative(),
});

export const UpdateTicketTypeSchema = CreateTicketTypeSchema.partial();

export interface TicketSoldMessage {
  sale_id: string; // uuid
  occurred_at: string; // ISO-8601
  event_id: string; // uuid
  ticket_type_id: string; // uuid
  channel: SalesChannel;
  quantity: number;
  unit_price_cents: number;
  gtv_cents: number;
}
