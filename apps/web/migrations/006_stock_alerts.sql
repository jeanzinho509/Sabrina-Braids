CREATE TABLE stock_alerts (
  stock_item_id INTEGER PRIMARY KEY REFERENCES stock_items(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE FUNCTION salon_stock_alert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity <= GREATEST(3, NEW.min_quantity) THEN
    IF TG_OP = 'INSERT' OR OLD.quantity IS DISTINCT FROM NEW.quantity
       OR OLD.min_quantity IS DISTINCT FROM NEW.min_quantity THEN
      INSERT INTO stock_alerts (stock_item_id) VALUES (NEW.id)
      ON CONFLICT (stock_item_id) DO UPDATE SET
        triggered_at = NOW(), seen_at = NULL, resolved_at = NULL,
        version = stock_alerts.version + 1;
    END IF;
  ELSE
    UPDATE stock_alerts SET resolved_at = NOW()
    WHERE stock_item_id = NEW.id AND resolved_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_level_notification AFTER INSERT OR UPDATE OF quantity, min_quantity
ON stock_items FOR EACH ROW EXECUTE FUNCTION salon_stock_alert();

-- Also notify about low stock that existed before this upgrade.
INSERT INTO stock_alerts (stock_item_id)
SELECT id FROM stock_items WHERE quantity <= GREATEST(3, min_quantity);
