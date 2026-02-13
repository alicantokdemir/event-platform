import { styles } from '../styles';
import type { EventRow } from '../types';

type Props = {
  events: EventRow[];
  eventId: string;
  onEventChange: (value: string) => void;
  selectedEvent: EventRow | null;
};

export function DashboardHeader({
  events,
  eventId,
  onEventChange,
  selectedEvent,
}: Props) {
  return (
    <header style={styles.header}>
      <div>
        <div style={styles.kicker}>Event Ops</div>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          Manage events, track sales, and watch occupancy move in real time.
        </p>
      </div>
      <div style={styles.selectCard}>
        <label style={styles.label}>Current event</label>
        <select
          style={styles.select}
          value={eventId}
          onChange={(e) => onEventChange(e.target.value)}
        >
          <option value="" disabled>
            Select an event
          </option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} — {e.location}
            </option>
          ))}
        </select>
        {selectedEvent ? (
          <div style={styles.metaRow}>
            <span>{selectedEvent.sales_channels.join(' • ') || 'No channels'}</span>
            <span>{selectedEvent.total_capacity} capacity</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
