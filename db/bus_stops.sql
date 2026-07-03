CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS bus_stops (
  bus_stop_code text PRIMARY KEY,
  road_name text NOT NULL,
  description text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geom geometry(Point, 4326) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bus_stops_geom_gist
ON bus_stops
USING GIST (geom);
