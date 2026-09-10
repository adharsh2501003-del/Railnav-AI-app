CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS stations (
  id text PRIMARY KEY, name text NOT NULL, code text UNIQUE NOT NULL, city text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata', location geography(Point, 4326),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS floors (
  id text NOT NULL, station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  level text NOT NULL, label text NOT NULL, PRIMARY KEY (station_id, id)
);
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  floor_id text NOT NULL, name text NOT NULL, type text NOT NULL, details text NOT NULL DEFAULT '',
  location geometry(Point, 3857) NOT NULL, accessible boolean NOT NULL DEFAULT true,
  crowd text NOT NULL DEFAULT 'Low', keywords text[] NOT NULL DEFAULT '{}',
  FOREIGN KEY (station_id, floor_id) REFERENCES floors(station_id, id)
);
CREATE INDEX IF NOT EXISTS facilities_location_gix ON facilities USING gist(location);
CREATE TABLE IF NOT EXISTS trains (
  number text PRIMARY KEY, station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  name text NOT NULL, platform text NOT NULL, departure_time timestamptz, delay_minutes integer NOT NULL DEFAULT 0,
  crowd_level text NOT NULL DEFAULT 'Low', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), station_id text REFERENCES stations(id) ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, message text NOT NULL, read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS saved_routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), user_id uuid NOT NULL, station_id text REFERENCES stations(id),
  from_facility uuid REFERENCES facilities(id), to_facility uuid REFERENCES facilities(id),
  route jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE,
  phone text UNIQUE,
  role text NOT NULL DEFAULT 'passenger',
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS staff_stations (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, station_id)
);
CREATE TABLE IF NOT EXISTS nav_nodes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  floor_id text NOT NULL,
  kind text NOT NULL,
  location geometry(Point, 3857) NOT NULL,
  FOREIGN KEY (station_id, floor_id) REFERENCES floors(station_id, id)
);
CREATE TABLE IF NOT EXISTS nav_edges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id uuid NOT NULL REFERENCES nav_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES nav_nodes(id) ON DELETE CASCADE,
  distance_m numeric NOT NULL CHECK (distance_m >= 0),
  accessible boolean NOT NULL DEFAULT true,
  kind text NOT NULL DEFAULT 'walk'
);
CREATE TABLE IF NOT EXISTS sos_incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  floor_id text,
  location geometry(Point, 3857),
  status text NOT NULL DEFAULT 'open',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trains ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY facilities_public_read ON facilities FOR SELECT USING (true);
CREATE POLICY trains_public_read ON trains FOR SELECT USING (true);
CREATE POLICY nav_nodes_public_read ON nav_nodes FOR SELECT USING (true);
CREATE POLICY nav_edges_public_read ON nav_edges FOR SELECT USING (true);
CREATE POLICY sos_staff_read ON sos_incidents FOR SELECT USING (true);
