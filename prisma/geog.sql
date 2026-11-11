-- Run when we do a pnpm migrate which is safe to run
CREATE OR REPLACE FUNCTION routes_set_geog() RETURNS trigger AS $$
BEGIN
  NEW.from_geog := ST_SetSRID(ST_MakePoint(NEW.from_lng, NEW.from_lat), 4326)::geography;
  NEW.to_geog := ST_SetSRID(ST_MakePoint(NEW.to_lng, NEW.to_lat), 4326)::geography;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS routes_set_geog_trg ON routes;

CREATE TRIGGER routes_set_geog_trg
BEFORE INSERT OR UPDATE OF from_lat, from_lng, to_lat, to_lng ON routes
FOR EACH ROW EXECUTE FUNCTION routes_set_geog();

UPDATE routes
SET from_geog = ST_SetSRID(ST_MakePoint(from_lng, from_lat), 4326)::geography,
    to_geog = ST_SetSRID(ST_MakePoint(to_lng, to_lat), 4326)::geography
WHERE from_geog IS NULL OR to_geog IS NULL;
