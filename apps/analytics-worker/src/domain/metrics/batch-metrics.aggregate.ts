import type { TicketSoldMessage } from '@platform/contracts';

type Totals = { gtv: number; sold: number };

export class BatchMetricsAggregate {
  private readonly totals = new Map<string, Totals>();
  private readonly channels = new Map<string, Totals>();

  addSale(msg: TicketSoldMessage): void {
    const gtv = msg.gtv_cents;
    const sold = msg.quantity;

    const t = this.totals.get(msg.event_id) ?? { gtv: 0, sold: 0 };
    t.gtv += gtv;
    t.sold += sold;
    this.totals.set(msg.event_id, t);

    const key = `${msg.event_id}::${msg.channel}`;
    const c = this.channels.get(key) ?? { gtv: 0, sold: 0 };
    c.gtv += gtv;
    c.sold += sold;
    this.channels.set(key, c);
  }

  eventIds(): string[] {
    return Array.from(this.totals.keys());
  }

  totalsEntries(): Array<[string, Totals]> {
    return Array.from(this.totals.entries());
  }

  channelEntries(): Array<[string, Totals]> {
    return Array.from(this.channels.entries());
  }
}
