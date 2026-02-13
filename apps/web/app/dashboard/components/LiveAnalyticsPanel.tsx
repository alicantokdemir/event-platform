import { styles } from '../styles';
import type { Channel, Overview } from '../types';
import { formatCurrencyCents, formatNullable } from '../../shared/helpers';
import { StatCard } from './StatCard';

type Props = {
  overview: Overview | null;
  channels: Channel[] | null;
};

export function LiveAnalyticsPanel({ overview, channels }: Props) {
  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <h2 style={styles.panelTitle}>Live Analytics</h2>
        <span style={styles.panelBadge}>Last 24h</span>
      </div>

      <div style={styles.cardGrid}>
        <StatCard
          title="GTV"
          value={formatNullable(overview, (value) =>
            formatCurrencyCents(value.gtvCentsTotal),
          )}
        />
        <StatCard
          title="Occupancy %"
          value={formatNullable(overview, (value) =>
            value.occupancyPct.toFixed(2),
          )}
        />
        <StatCard
          title="Tickets Sold"
          value={formatNullable(overview, (value) =>
            String(value.ticketsSoldTotal),
          )}
        />
        <StatCard
          title="Capacity"
          value={formatNullable(overview, (value) => String(value.capacityTotal))}
        />
      </div>

      <div style={styles.tableHeader}>
        <h3 style={styles.listTitle}>Sales by Channel</h3>
        <span style={styles.smallHint}>Grouped by channel</span>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Channel</th>
            <th style={styles.th}>Tickets</th>
            <th style={styles.th}>GTV</th>
          </tr>
        </thead>
        <tbody>
          {(channels ?? []).map((c) => (
            <tr key={c.channel}>
              <td style={styles.td}>{c.channel}</td>
              <td style={styles.td}>{c.ticketsSold}</td>
              <td style={styles.td}>{formatCurrencyCents(c.gtvCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
