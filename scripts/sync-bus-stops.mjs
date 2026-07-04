import pg from "pg";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local"
});

const { Client } = pg;

const DATA_MALL_BUS_STOPS_URL =
  "https://datamall2.mytransport.sg/ltaodataservice/BusStops";

const PAGE_SIZE = 500;

async function main() {
  console.log("========== START ==========");

  const databaseUrl = process.env.DATABASE_URL;
  const accountKey =
    process.env.LTA_DATA_MALL_ACCOUNT_KEY ??
    process.env.LTA_ACCOUNT_KEY;

  console.log("DATABASE_URL:", databaseUrl ? "Loaded" : "Missing");
  console.log("ACCOUNT_KEY :", accountKey ? "Loaded" : "Missing");

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL.");
  }

  if (!accountKey) {
    throw new Error("Missing LTA_DATA_MALL_ACCOUNT_KEY.");
  }

  console.log("\n[1] Connecting to PostgreSQL...");

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  console.log("[2] Connected to PostgreSQL.");

  try {
    console.log("[3] Creating PostGIS extension...");

    await client.query(
      "CREATE EXTENSION IF NOT EXISTS postgis"
    );

    console.log("[4] Creating bus_stops table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS bus_stops (
        bus_stop_code text PRIMARY KEY,
        road_name text NOT NULL,
        description text NOT NULL,
        latitude double precision NOT NULL,
        longitude double precision NOT NULL,
        geom geometry(Point,4326) NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    console.log("[5] Table OK.");

    console.log("[6] Creating spatial index...");

    await client.query(`
      CREATE INDEX IF NOT EXISTS bus_stops_geom_gist
      ON bus_stops
      USING GIST (geom)
    `);

    console.log("[7] Index OK.");

    console.log("[8] Downloading bus stops from LTA...");

    const stops = await fetchAllBusStops(accountKey);

    console.log(`[9] Downloaded ${stops.length} bus stops.`);

    console.log("[10] Beginning transaction...");

    await client.query("BEGIN");

    try {
      console.log("[11] Truncating table...");

      await client.query("TRUNCATE TABLE bus_stops");

      console.log("[12] Inserting rows...");

      let count = 0;

      for (const stop of stops) {
        await client.query(
          `
          INSERT INTO bus_stops(
            bus_stop_code,
            road_name,
            description,
            latitude,
            longitude,
            geom,
            updated_at
          )
          VALUES(
            $1,
            $2,
            $3,
            $4,
            $5,
            ST_SetSRID(ST_MakePoint($5,$4),4326),
            now()
          )
        `,
          [
            stop.BusStopCode,
            stop.RoadName,
            stop.Description,
            stop.Latitude,
            stop.Longitude,
          ]
        );

        count++;

        if (count % 500 === 0) {
          console.log(`Inserted ${count} rows...`);
        }
      }

      console.log("[13] Commit...");

      await client.query("COMMIT");

      console.log("[14] Commit complete.");

      console.log(`✅ Synced ${count} bus stops.`);
    } catch (err) {
      console.log("ROLLBACK");

      await client.query("ROLLBACK");

      throw err;
    }
  } finally {
    console.log("[15] Closing database connection...");

    await client.end();

    console.log("Done.");
  }
}

async function fetchAllBusStops(accountKey) {
  const headers = new Headers({
    AccountKey: accountKey,
    accept: "application/json",
  });

  const allStops = [];

  let skip = 0;

  while (true) {
    const url = new URL(DATA_MALL_BUS_STOPS_URL);

    url.searchParams.set("$top", PAGE_SIZE.toString());
    url.searchParams.set("$skip", skip.toString());

    console.log(`Requesting page starting at ${skip}...`);

    const response = await fetch(url, {
      headers,
    });

    console.log("HTTP Status:", response.status);

    if (!response.ok) {
      const text = await response.text();

      console.log(text);

      throw new Error(
        `BusStops request failed (${response.status})`
      );
    }

    const payload = await response.json();

    const page = Array.isArray(payload?.value)
      ? payload.value
      : [];

    console.log(`Received ${page.length} rows.`);

    allStops.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    skip += PAGE_SIZE;
  }

  return allStops;
}

main().catch((err) => {
  console.error("\nERROR:");
  console.error(err);
  process.exit(1);
});