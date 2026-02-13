import { CreateQueueCommand, GetQueueUrlCommand, SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

type SalesChannel = 'online' | 'box_office' | 'partners';
type TicketKind = 'FULL' | 'HALF';

type FixtureEvent = {
  key: string;
  name: string;
  location: string;
  total_capacity: number;
  sales_channels: SalesChannel[];
  ticket_types: Array<{ name: string; kind: TicketKind; price_cents: number; capacity: number }>;
};

type FixtureSale = {
  event_key: string;
  ticket_type_name: string;
  channel: SalesChannel;
  quantity: number;
  count: number;
  days: number;
};

type EventResponse = {
  id: string;
  name: string;
  location: string;
  total_capacity: number;
  sales_channels: SalesChannel[];
};

type TicketTypeResponse = {
  id: string;
  name: string;
  kind: TicketKind;
  price_cents: number;
  capacity: number;
};

type SeedState = {
  createdAt: string;
  events: Array<{ key: string; eventId: string; ticketTypes: Array<{ name: string; id: string }> }>;
};

type TicketSoldMessage = {
  sale_id: string;
  occurred_at: string;
  event_id: string;
  ticket_type_id: string;
  channel: SalesChannel;
  quantity: number;
  unit_price_cents: number;
  gtv_cents: number;
};

const ROOT = path.resolve(__dirname, '../../..');
const EVENTS_FIXTURE = path.resolve(ROOT, 'tools/seed/fixtures/events.json');
const SALES_FIXTURE = path.resolve(ROOT, 'tools/seed/fixtures/sales.json');
const STATE_FILE = path.resolve(ROOT, 'tools/seed/.seed-state.json');

for (const envPath of [
  path.resolve(ROOT, '.env'),
  path.resolve(ROOT, 'apps/analytics-worker/.env'),
  path.resolve(ROOT, 'tools/seed/.env'),
]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true });
}

const EVENT_API = process.env.EVENT_SERVICE_URL ?? 'http://localhost:3001';
const QUEUE_URL = process.env.SQS_QUEUE_URL ?? '';
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
const SQS_ENDPOINT = process.env.SQS_ENDPOINT;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!QUEUE_URL) throw new Error('SQS_QUEUE_URL is required');

function queueNameFromUrl(queueUrl: string): string {
  const parts = queueUrl.split('/').filter(Boolean);
  const queueName = parts[parts.length - 1];
  if (!queueName) throw new Error(`Unable to infer queue name from SQS_QUEUE_URL: ${queueUrl}`);
  return queueName;
}

async function ensureQueueExists(sqs: SQSClient, queueUrl: string): Promise<void> {
  const queueName = queueNameFromUrl(queueUrl);
  try {
    await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }));
  } catch {
    await sqs.send(new CreateQueueCommand({ QueueName: queueName }));
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function randTimestamp(days: number): string {
  const now = Date.now();
  const delta = Math.floor(Math.random() * Math.max(1, days) * 24 * 60 * 60 * 1000);
  return new Date(now - delta).toISOString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} for ${url}: ${text}`);
  }
  return (await res.json()) as T;
}

async function main() {
  const eventsFixture = readJson<FixtureEvent[]>(EVENTS_FIXTURE);
  const salesFixture = readJson<FixtureSale[]>(SALES_FIXTURE);

  const sqs = new SQSClient({
    region: AWS_REGION,
    ...(SQS_ENDPOINT ? { endpoint: SQS_ENDPOINT } : {}),
    ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
      ? { credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY } }
      : {}),
  });

  await ensureQueueExists(sqs, QUEUE_URL);

  const state: SeedState = { createdAt: new Date().toISOString(), events: [] };

  for (const fixture of eventsFixture) {
    const createdEvent = await postJson<EventResponse>(`${EVENT_API}/events`, {
      name: fixture.name,
      location: fixture.location,
      total_capacity: fixture.total_capacity,
      sales_channels: fixture.sales_channels,
    });

    const createdTicketTypes: Array<{ name: string; id: string }> = [];

    for (const tt of fixture.ticket_types) {
      const created = await postJson<TicketTypeResponse>(`${EVENT_API}/events/${createdEvent.id}/ticket-types`, tt);
      createdTicketTypes.push({ name: created.name, id: created.id });
    }

    state.events.push({ key: fixture.key, eventId: createdEvent.id, ticketTypes: createdTicketTypes });
  }

  const entriesByEvent = new Map<string, TicketSoldMessage[]>();

  for (const sale of salesFixture) {
    const eventState = state.events.find((e) => e.key === sale.event_key);
    if (!eventState) throw new Error(`Unknown event_key in sales fixture: ${sale.event_key}`);

    const ticketType = eventState.ticketTypes.find((t) => t.name === sale.ticket_type_name);
    if (!ticketType) {
      throw new Error(`Unknown ticket_type_name '${sale.ticket_type_name}' for event_key '${sale.event_key}'`);
    }

    const list = entriesByEvent.get(eventState.eventId) ?? [];
    for (let i = 0; i < sale.count; i++) {
      const unit = eventsFixture
        .find((e) => e.key === sale.event_key)!
        .ticket_types.find((t) => t.name === sale.ticket_type_name)!.price_cents;

      list.push({
        sale_id: randomUUID(),
        occurred_at: randTimestamp(sale.days),
        event_id: eventState.eventId,
        ticket_type_id: ticketType.id,
        channel: sale.channel,
        quantity: sale.quantity,
        unit_price_cents: unit,
        gtv_cents: unit * sale.quantity,
      });
    }
    entriesByEvent.set(eventState.eventId, list);
  }

  let totalMessages = 0;
  for (const [, messages] of entriesByEvent) {
    totalMessages += messages.length;
    for (let i = 0; i < messages.length; i += 10) {
      const chunk = messages.slice(i, i + 10);
      await sqs.send(
        new SendMessageBatchCommand({
          QueueUrl: QUEUE_URL,
          Entries: chunk.map((m, idx) => ({ Id: `${i + idx}`, MessageBody: JSON.stringify(m) })),
        })
      );
    }
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`Fixture seed complete: ${state.events.length} events, ${totalMessages} sales messages.`);
  console.log(`State file written: ${STATE_FILE}`);

  const createdEvents = await fetchJson<EventResponse[]>(`${EVENT_API}/events`);
  console.log(`Current events in API: ${createdEvents.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
