import { centsToDollars, dollarsToCents } from '../../shared/helpers';
import { styles } from '../styles';
import type {
  EventForm,
  EventRow,
  TicketTypeForm,
  TicketTypeRow,
} from '../types';

type Props = {
  events: EventRow[];
  eventId: string;
  selectedEvent: EventRow | null;
  allocatedCapacity: number;
  unallocatedCapacity: number;
  createForm: EventForm;
  editForm: EventForm;
  editingId: string | null;
  ticketTypes: TicketTypeRow[];
  ticketCreateForm: TicketTypeForm;
  editTicketForm: TicketTypeForm;
  editingTicketId: string | null;
  busy: boolean;
  salesChannelOptions: readonly string[];
  ticketKindOptions: readonly ('FULL' | 'HALF')[];
  onCreateFormChange: (patch: Partial<EventForm>) => void;
  onEditFormChange: (patch: Partial<EventForm>) => void;
  onTicketCreateFormChange: (patch: Partial<TicketTypeForm>) => void;
  onEditTicketFormChange: (patch: Partial<TicketTypeForm>) => void;
  onToggleCreateChannel: (channel: string) => void;
  onToggleEditChannel: (channel: string) => void;
  onCreateEvent: () => void;
  onStartEditEvent: (evt: EventRow) => void;
  onSaveEvent: () => void;
  onCancelEditEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onCreateTicketType: () => void;
  onStartEditTicketType: (ticketType: TicketTypeRow) => void;
  onSaveTicketType: () => void;
  onCancelEditTicketType: () => void;
  onDeleteTicketType: (id: string) => void;
};

export function EventManagementPanel({
  events,
  eventId,
  selectedEvent,
  allocatedCapacity,
  unallocatedCapacity,
  createForm,
  editForm,
  editingId,
  ticketTypes,
  ticketCreateForm,
  editTicketForm,
  editingTicketId,
  busy,
  salesChannelOptions,
  ticketKindOptions,
  onCreateFormChange,
  onEditFormChange,
  onTicketCreateFormChange,
  onEditTicketFormChange,
  onToggleCreateChannel,
  onToggleEditChannel,
  onCreateEvent,
  onStartEditEvent,
  onSaveEvent,
  onCancelEditEvent,
  onDeleteEvent,
  onCreateTicketType,
  onStartEditTicketType,
  onSaveTicketType,
  onCancelEditTicketType,
  onDeleteTicketType,
}: Props) {
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Event Management</h2>
        <span style={styles.panelBadge}>{events.length} total</span>
      </div>

      <div style={styles.formGrid}>
        <input
          style={styles.input}
          placeholder="Event name"
          value={createForm.name}
          onChange={(e) => onCreateFormChange({ name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Location"
          value={createForm.location}
          onChange={(e) => onCreateFormChange({ location: e.target.value })}
        />
        <input
          style={styles.input}
          type="number"
          min={0}
          placeholder="Total capacity"
          value={createForm.total_capacity || ''}
          onChange={(e) =>
            onCreateFormChange({ total_capacity: Number(e.target.value) })
          }
        />
        <div style={styles.checkboxGroup}>
          {salesChannelOptions.map((channel) => (
            <label key={channel} style={styles.checkboxOption}>
              <input
                type="checkbox"
                checked={createForm.sales_channels.includes(channel)}
                onChange={() => onToggleCreateChannel(channel)}
              />
              {channel}
            </label>
          ))}
        </div>
        <button
          style={styles.primaryButton}
          disabled={busy}
          onClick={onCreateEvent}
        >
          Create event
        </button>
      </div>

      <div style={styles.listHeader}>
        <h3 style={styles.listTitle}>Events</h3>
        <span style={styles.smallHint}>Edit or remove existing events</span>
      </div>
      <div style={styles.list}>
        {events.map((evt) => (
          <div key={evt.id} style={styles.listRow}>
            {editingId === evt.id ? (
              <div style={styles.editGrid}>
                <input
                  style={styles.input}
                  value={editForm.name}
                  onChange={(e) => onEditFormChange({ name: e.target.value })}
                />
                <input
                  style={styles.input}
                  value={editForm.location}
                  onChange={(e) =>
                    onEditFormChange({ location: e.target.value })
                  }
                />
                <input
                  style={styles.input}
                  type="number"
                  min={0}
                  value={editForm.total_capacity}
                  onChange={(e) =>
                    onEditFormChange({ total_capacity: Number(e.target.value) })
                  }
                />
                <div style={styles.checkboxGroup}>
                  {salesChannelOptions.map((channel) => (
                    <label key={channel} style={styles.checkboxOption}>
                      <input
                        type="checkbox"
                        checked={editForm.sales_channels.includes(channel)}
                        onChange={() => onToggleEditChannel(channel)}
                      />
                      {channel}
                    </label>
                  ))}
                </div>
                <div style={styles.actionRow}>
                  <button
                    style={styles.primaryButton}
                    disabled={busy}
                    onClick={onSaveEvent}
                  >
                    Save
                  </button>
                  <button
                    style={styles.ghostButton}
                    onClick={onCancelEditEvent}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div style={styles.rowTitle}>{evt.name}</div>
                  <div style={styles.rowMeta}>
                    {evt.location} • {evt.total_capacity} capacity
                  </div>
                  <div style={styles.rowMeta}>
                    {evt.sales_channels.join(', ') || 'No channels'}
                  </div>
                </div>
                <div style={styles.actionRow}>
                  <button
                    style={styles.ghostButton}
                    onClick={() => onStartEditEvent(evt)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.dangerButton}
                    disabled={busy}
                    onClick={() => onDeleteEvent(evt.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={styles.listHeader}>
        <h3 style={styles.listTitle}>Ticket Types / Sectors</h3>
        <span style={styles.smallHint}>
          {selectedEvent ? `For ${selectedEvent.name}` : 'Select an event'}
        </span>
      </div>

      {selectedEvent ? (
        <div style={styles.metaRowWide}>
          <span>Total capacity: {selectedEvent.total_capacity}</span>
          <span>Allocated: {allocatedCapacity}</span>
          <span>Unallocated: {unallocatedCapacity}</span>
        </div>
      ) : null}

      <div style={styles.formGrid}>
        <input
          style={styles.input}
          placeholder="Ticket type name"
          value={ticketCreateForm.name}
          onChange={(e) => onTicketCreateFormChange({ name: e.target.value })}
          disabled={!eventId}
        />
        <select
          style={styles.selectInput}
          value={ticketCreateForm.kind}
          onChange={(e) =>
            onTicketCreateFormChange({
              kind: e.target.value as 'FULL' | 'HALF',
            })
          }
          disabled={!eventId}
        >
          {ticketKindOptions.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        <input
          style={styles.input}
          type="number"
          min={0}
          step="0.01"
          placeholder="Price ($)"
          value={centsToDollars(ticketCreateForm.price_cents)}
          onChange={(e) =>
            onTicketCreateFormChange({
              price_cents: dollarsToCents(e.target.value),
            })
          }
          disabled={!eventId}
        />
        <input
          style={styles.input}
          type="number"
          min={0}
          placeholder="Capacity"
          value={ticketCreateForm.capacity || ''}
          onChange={(e) =>
            onTicketCreateFormChange({ capacity: Number(e.target.value) })
          }
          disabled={!eventId}
        />
        <button
          style={styles.primaryButton}
          disabled={busy || !eventId}
          onClick={onCreateTicketType}
        >
          Create ticket type
        </button>
      </div>

      <div style={styles.list}>
        {ticketTypes.map((tt) => (
          <div key={tt.id} style={styles.listRow}>
            {editingTicketId === tt.id ? (
              <div style={styles.editGrid}>
                <input
                  style={styles.input}
                  value={editTicketForm.name}
                  onChange={(e) =>
                    onEditTicketFormChange({ name: e.target.value })
                  }
                />
                <select
                  style={styles.selectInput}
                  value={editTicketForm.kind}
                  onChange={(e) =>
                    onEditTicketFormChange({
                      kind: e.target.value as 'FULL' | 'HALF',
                    })
                  }
                >
                  {ticketKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
                <input
                  style={styles.input}
                  type="number"
                  min={0}
                  step="0.01"
                  value={centsToDollars(editTicketForm.price_cents)}
                  onChange={(e) =>
                    onEditTicketFormChange({
                      price_cents: dollarsToCents(e.target.value),
                    })
                  }
                />
                <input
                  style={styles.input}
                  type="number"
                  min={0}
                  value={editTicketForm.capacity}
                  onChange={(e) =>
                    onEditTicketFormChange({ capacity: Number(e.target.value) })
                  }
                />
                <div style={styles.actionRow}>
                  <button
                    style={styles.primaryButton}
                    disabled={busy}
                    onClick={onSaveTicketType}
                  >
                    Save
                  </button>
                  <button
                    style={styles.ghostButton}
                    onClick={onCancelEditTicketType}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div style={styles.rowTitle}>{tt.name}</div>
                  <div style={styles.rowMeta}>Kind: {tt.kind}</div>
                  <div style={styles.rowMeta}>
                    ${(tt.price_cents / 100).toFixed(2)} • {tt.capacity}{' '}
                    capacity
                  </div>
                </div>
                <div style={styles.actionRow}>
                  <button
                    style={styles.ghostButton}
                    onClick={() => onStartEditTicketType(tt)}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.dangerButton}
                    disabled={busy}
                    onClick={() => onDeleteTicketType(tt.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
