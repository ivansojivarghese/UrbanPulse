import pg from 'pg';

const { Client } = pg;

const DATA_MALL_BUS_STOPS_URL = 'https://datamall2.mytransport.sg/ltaodataservice/BusStops';
const PAGE_SIZE = 500;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const accountKey = process.env.LTA_DATA_MALL_ACCOUNT_KEY ?? process.env.LTA_ACCOUNT_KEY;

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL.');
  }

  if (!accountKey) {
    throw new Error('Missing LTA_DATA_MALL_ACCOUNT_KEY.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');

    await client.query(`
      CREATE TABLE IF NOT EXISTS bus_stops (
        bus_stop_code text PRIMARY KEY,
        road_name text NOT NULL,
        description text NOT NULL,
        latitude double precision NOT NULL,
        longitude double precision NOT NULL,
        geom geometry(Point, 4326) NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS bus_stops_geom_gist
      ON bus_stops
      USING GIST (geom)
    `);

    const stops = await fetchAllBusStops(accountKey);

    await client.query('BEGIN');

    try {
      await client.query('TRUNCATE TABLE bus_stops');

      for (const stop of stops) {
        await client.query(
          `
            INSERT INTO bus_stops (
              bus_stop_code,
              road_name,
              description,
              latitude,
              longitude,
              geom,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($5, $4), 4326), now())
          `,
          [
            stop.BusStopCode,
            stop.RoadName,
            stop.Description,
            stop.Latitude,
            stop.Longitude
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log(`Synced ${stops.length} bus stops.`);
  } finally {
    await client.end();
  }
}

async function fetchAllBusStops(accountKey) {
  const headers = new Headers({
    AccountKey: accountKey,
    accept: 'application/json'
  });

  const allStops = [];
  let skip = 0;

  while (true) {
    const url = new URL(DATA_MALL_BUS_STOPS_URL);
    url.searchParams.set('$top', String(PAGE_SIZE));
    url.searchParams.set('$skip', String(skip));

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`BusStops request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const page = Array.isArray(payload?.value) ? payload.value : [];

    allStops.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    skip += PAGE_SIZE;
  }

  return allStops;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
