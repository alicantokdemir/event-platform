'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { EventManagementPanel } from './components/EventManagementPanel';
import { LiveAnalyticsPanel } from './components/LiveAnalyticsPanel';
import { styles } from './styles';
import type {
  Channel,
  EventForm,
  EventRow,
  Overview,
  TicketTypeForm,
  TicketTypeRow,
} from './types';

type FieldErrorPayload = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
};

const EVENT_API = process.env.NEXT_PUBLIC_EVENT_API_URL!;
const ANALYTICS_API = process.env.NEXT_PUBLIC_ANALYTICS_API_URL!;
const SALES_CHANNEL_OPTIONS = ['online', 'box_office', 'partners'] as const;
const TICKET_KIND_OPTIONS = ['FULL', 'HALF'] as const;

const IMPORTANT_400_MESSAGES: Record<string, string> = {
  'ticket type capacity exceeds event total_capacity':
    'Ticket type capacity exceeds the event total capacity. Reduce ticket type capacity or increase event total capacity.',
  'total_capacity is below existing ticket type capacity':
    'Event total capacity cannot be lower than currently allocated ticket type capacity.',
  'eventId is required': 'Please select an event first.',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  location: 'Location',
  total_capacity: 'Total capacity',
  sales_channels: 'Sales channels',
  kind: 'Ticket kind',
  price_cents: 'Price',
  capacity: 'Capacity',
};

const emptyEvent: EventForm = {
  name: '',
  location: '',
  total_capacity: 0,
  sales_channels: [],
};

const emptyTicketType: TicketTypeForm = {
  name: '',
  kind: 'FULL',
  price_cents: 0,
  capacity: 0,
};

function normalizeErrorMessage(message: string): string {
  return IMPORTANT_400_MESSAGES[message] ?? message;
}

function parseFieldValidation(payload: FieldErrorPayload): string | null {
  const issues: string[] = [];

  if (Array.isArray(payload.formErrors) && payload.formErrors.length > 0) {
    issues.push(...payload.formErrors);
  }

  if (payload.fieldErrors && typeof payload.fieldErrors === 'object') {
    for (const [field, messages] of Object.entries(payload.fieldErrors)) {
      if (!Array.isArray(messages) || messages.length === 0) continue;
      const label = FIELD_LABELS[field] ?? field;
      issues.push(`${label}: ${messages[0]}`);
    }
  }

  if (issues.length === 0) return null;
  return `Please fix: ${issues.join(' | ')}`;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const contentType = res.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await res.json()) as
      | { message?: string | string[]; error?: string; statusCode?: number }
      | FieldErrorPayload;

    if ('message' in body) {
      const msg = body.message;
      if (typeof msg === 'string') return normalizeErrorMessage(msg);
      if (Array.isArray(msg) && msg.length > 0) {
        return msg.map((m) => normalizeErrorMessage(String(m))).join(' | ');
      }
    }

    const validationMessage = parseFieldValidation(body as FieldErrorPayload);
    if (validationMessage) return validationMessage;
  } else {
    const text = (await res.text()).trim();
    if (text) return normalizeErrorMessage(text);
  }

  return fallback;
}

async function assertOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  const message = await readErrorMessage(res, fallback);
  throw new Error(message);
}

function toErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected error. Please try again.';
}

function toggleChannel(current: string[], channel: string): string[] {
  if (current.includes(channel)) {
    return current.filter((c) => c !== channel);
  }
  return [...current, channel];
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState<string>('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [createForm, setCreateForm] = useState<EventForm>(emptyEvent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventForm>(emptyEvent);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeRow[]>([]);
  const [ticketCreateForm, setTicketCreateForm] =
    useState<TicketTypeForm>(emptyTicketType);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editTicketForm, setEditTicketForm] =
    useState<TicketTypeForm>(emptyTicketType);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [eventId, events],
  );

  const allocatedCapacity = useMemo(
    () => ticketTypes.reduce((sum, tt) => sum + tt.capacity, 0),
    [ticketTypes],
  );

  const unallocatedCapacity = useMemo(
    () => Math.max((selectedEvent?.total_capacity ?? 0) - allocatedCapacity, 0),
    [selectedEvent, allocatedCapacity],
  );

  const loadEvents = useCallback(async () => {
    setError('');
    const res = await fetch(`${EVENT_API}/events`);
    await assertOk(res, `Failed to load events (${res.status}).`);
    const data = (await res.json()) as EventRow[];
    setEvents(data);
    if (data?.[0]?.id) setEventId((prev) => prev || data[0].id);
  }, []);

  const loadTicketTypes = useCallback(async (targetEventId: string) => {
    const res = await fetch(`${EVENT_API}/events/${targetEventId}/ticket-types`);
    await assertOk(res, `Failed to load ticket types (${res.status}).`);
    const data = (await res.json()) as TicketTypeRow[];
    setTicketTypes(data);
  }, []);

  useEffect(() => {
    loadEvents().catch((e) => setError(toErrorText(e)));
  }, [loadEvents]);

  useEffect(() => {
    if (!eventId) {
      setError('');
      setOverview(null);
      setChannels(null);
      return;
    }

    (async () => {
      setError('');
      setOverview(null);
      setChannels(null);

      const [oRes, cRes] = await Promise.all([
        fetch(
          `${ANALYTICS_API}/dashboard/overview?eventId=${encodeURIComponent(eventId)}`,
        ),
        fetch(
          `${ANALYTICS_API}/dashboard/channels?eventId=${encodeURIComponent(eventId)}`,
        ),
      ]);

      await assertOk(oRes, `Overview request failed (${oRes.status}).`);
      await assertOk(cRes, `Channels request failed (${cRes.status}).`);

      setOverview(await oRes.json());
      setChannels(await cRes.json());
    })().catch((e) => setError(toErrorText(e)));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setTicketTypes([]);
      return;
    }
    loadTicketTypes(eventId).catch((e) => setError(toErrorText(e)));
  }, [eventId, loadTicketTypes]);

  const handleCreate = async () => {
    if (
      !createForm.name ||
      !createForm.location ||
      createForm.total_capacity <= 0 ||
      createForm.sales_channels.length === 0
    ) {
      setError(
        'Name, location, total capacity, and at least one sales channel are required.',
      );
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${EVENT_API}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          location: createForm.location,
          total_capacity: createForm.total_capacity,
          sales_channels: createForm.sales_channels,
        }),
      });
      await assertOk(res, `Create event failed (${res.status}).`);

      const created = (await res.json()) as EventRow;
      setEventId(created.id);
      setCreateForm(emptyEvent);
      await loadEvents();
      await loadTicketTypes(created.id);
    } catch (e) {
      setError(toErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (evt: EventRow) => {
    setEditingId(evt.id);
    setEditForm({
      name: evt.name,
      location: evt.location,
      total_capacity: evt.total_capacity,
      sales_channels: evt.sales_channels,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (editForm.sales_channels.length === 0) {
      setError('At least one sales channel is required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${EVENT_API}/events/${editingId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          location: editForm.location,
          total_capacity: editForm.total_capacity,
          sales_channels: editForm.sales_channels,
        }),
      });
      await assertOk(res, `Update event failed (${res.status}).`);

      setEditingId(null);
      await loadEvents();
      if (eventId) await loadTicketTypes(eventId);
    } catch (e) {
      setError(toErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This also removes its ticket types.')) return;

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${EVENT_API}/events/${id}`, {
        method: 'DELETE',
      });
      await assertOk(res, `Delete event failed (${res.status}).`);

      if (eventId === id) setEventId('');
      await loadEvents();
      if (eventId && eventId !== id) await loadTicketTypes(eventId);
    } catch (e) {
      setError(toErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const startTicketEdit = (ticketType: TicketTypeRow) => {
    setEditingTicketId(ticketType.id);
    setEditTicketForm({
      name: ticketType.name,
      kind: ticketType.kind,
      price_cents: ticketType.price_cents,
      capacity: ticketType.capacity,
    });
  };

  const handleCreateTicketType = async () => {
    if (!eventId) {
      setError('Select an event first.');
      return;
    }

    if (
      !ticketCreateForm.name ||
      ticketCreateForm.price_cents < 0 ||
      ticketCreateForm.capacity < 0
    ) {
      setError('Ticket type name, price and capacity are required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${EVENT_API}/events/${eventId}/ticket-types`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ticketCreateForm),
      });
      await assertOk(res, `Create ticket type failed (${res.status}).`);

      setTicketCreateForm(emptyTicketType);
      await loadTicketTypes(eventId);
    } catch (e) {
      setError(toErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateTicketType = async () => {
    if (!editingTicketId) return;

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${EVENT_API}/ticket-types/${editingTicketId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editTicketForm),
      });
      await assertOk(res, `Update ticket type failed (${res.status}).`);

      setEditingTicketId(null);
      if (eventId) await loadTicketTypes(eventId);
    } catch (e) {
      setError(toErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTicketType = async (id: string) => {
    if (!confirm('Delete this ticket type?')) return;

    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${EVENT_API}/ticket-types/${id}`, {
        method: 'DELETE',
      });
      await assertOk(res, `Delete ticket type failed (${res.status}).`);

      if (eventId) await loadTicketTypes(eventId);
    } catch (e) {
      setError(toErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={styles.page}>
      <DashboardHeader
        events={events}
        eventId={eventId}
        onEventChange={setEventId}
        selectedEvent={selectedEvent}
      />

      {error ? <div style={styles.error}>{error}</div> : null}

      <section style={styles.grid}>
        <EventManagementPanel
          events={events}
          eventId={eventId}
          selectedEvent={selectedEvent}
          allocatedCapacity={allocatedCapacity}
          unallocatedCapacity={unallocatedCapacity}
          createForm={createForm}
          editForm={editForm}
          editingId={editingId}
          ticketTypes={ticketTypes}
          ticketCreateForm={ticketCreateForm}
          editTicketForm={editTicketForm}
          editingTicketId={editingTicketId}
          busy={busy}
          salesChannelOptions={SALES_CHANNEL_OPTIONS}
          ticketKindOptions={TICKET_KIND_OPTIONS}
          onCreateFormChange={(patch) =>
            setCreateForm((prev) => ({ ...prev, ...patch }))
          }
          onEditFormChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
          onTicketCreateFormChange={(patch) =>
            setTicketCreateForm((prev) => ({ ...prev, ...patch }))
          }
          onEditTicketFormChange={(patch) =>
            setEditTicketForm((prev) => ({ ...prev, ...patch }))
          }
          onToggleCreateChannel={(channel) =>
            setCreateForm((prev) => ({
              ...prev,
              sales_channels: toggleChannel(prev.sales_channels, channel),
            }))
          }
          onToggleEditChannel={(channel) =>
            setEditForm((prev) => ({
              ...prev,
              sales_channels: toggleChannel(prev.sales_channels, channel),
            }))
          }
          onCreateEvent={handleCreate}
          onStartEditEvent={startEdit}
          onSaveEvent={handleUpdate}
          onCancelEditEvent={() => setEditingId(null)}
          onDeleteEvent={handleDelete}
          onCreateTicketType={handleCreateTicketType}
          onStartEditTicketType={startTicketEdit}
          onSaveTicketType={handleUpdateTicketType}
          onCancelEditTicketType={() => setEditingTicketId(null)}
          onDeleteTicketType={handleDeleteTicketType}
        />

        <LiveAnalyticsPanel overview={overview} channels={channels} />
      </section>
    </main>
  );
}
