export type EventRow = {
  id: string;
  name: string;
  location: string;
  total_capacity: number;
  sales_channels: string[];
};

export type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  kind: 'FULL' | 'HALF';
  price_cents: number;
  capacity: number;
};

export type Overview = {
  gtvCentsTotal: number;
  occupancyPct: number;
  ticketsSoldTotal: number;
  capacityTotal: number;
};

export type Channel = {
  channel: string;
  gtvCents: number;
  ticketsSold: number;
};

export type EventForm = {
  name: string;
  location: string;
  total_capacity: number;
  sales_channels: string[];
};

export type TicketTypeForm = {
  name: string;
  kind: 'FULL' | 'HALF';
  price_cents: number;
  capacity: number;
};
