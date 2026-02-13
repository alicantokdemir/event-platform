\connect analytics_db;

CREATE TABLE IF NOT EXISTS event_metrics (
  event_id uuid PRIMARY KEY,
  gtv_cents_total bigint NOT NULL DEFAULT 0,
  tickets_sold_total bigint NOT NULL DEFAULT 0,
  capacity_total int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_channel_metrics (
  event_id uuid NOT NULL,
  channel text NOT NULL,
  gtv_cents bigint NOT NULL DEFAULT 0,
  tickets_sold bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, channel)
);

CREATE TABLE IF NOT EXISTS processed_sales (
  sale_id uuid PRIMARY KEY,
  processed_at timestamptz NOT NULL
);
