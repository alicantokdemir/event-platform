import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

type SeedState = {
  createdAt: string;
  events: Array<{ key: string; eventId: string }>;
};

const ROOT = path.resolve(__dirname, '../../..');
const STATE_FILE = path.resolve(ROOT, 'tools/seed/.seed-state.json');

for (const envPath of [
  path.resolve(ROOT, '.env'),
  path.resolve(ROOT, 'apps/event-service/.env'),
  path.resolve(ROOT, 'tools/seed/.env'),
]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true });
}

const EVENT_API = process.env.EVENT_SERVICE_URL ?? 'http://localhost:3001';

async function deleteEvent(eventId: string): Promise<void> {
  const res = await fetch(`${EVENT_API}/events/${eventId}`, { method: 'DELETE' });
  if (res.status === 404) return;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed deleting event ${eventId}: HTTP ${res.status} ${text}`);
  }
}

async function main() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log(`No state file found at ${STATE_FILE}. Nothing to delete.`);
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as SeedState;
  if (!state.events?.length) {
    console.log('State file has no events. Nothing to delete.');
    fs.unlinkSync(STATE_FILE);
    return;
  }

  for (const evt of state.events) {
    await deleteEvent(evt.eventId);
  }

  fs.unlinkSync(STATE_FILE);
  console.log(`Deleted ${state.events.length} seeded events and removed state file.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
