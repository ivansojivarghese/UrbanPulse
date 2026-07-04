import pg from "pg";
import dotenv from "dotenv";

dotenv.config({
    path: ".env.local"
});

const { Client } = pg;

const DATA_MALL_URL =
    "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2";

async function main() {

    console.log("========== CARPARK SYNC ==========");

    const databaseUrl = process.env.DATABASE_URL;
    const accountKey = process.env.LTA_DATA_MALL_ACCOUNT_KEY;

    if (!databaseUrl)
        throw new Error("DATABASE_URL missing");

    if (!accountKey)
        throw new Error("LTA_DATA_MALL_ACCOUNT_KEY missing");

    const client = new Client({
        connectionString: databaseUrl
    });

    console.log("Connecting to PostgreSQL...");

    await client.connect();

    console.log("Connected.");

    try {

        await client.query(
            "CREATE EXTENSION IF NOT EXISTS postgis"
        );

        console.log("Creating table...");

        await client.query(`

        CREATE TABLE IF NOT EXISTS carparks (

            carpark_id TEXT PRIMARY KEY,

            area TEXT,

            development TEXT,

            latitude DOUBLE PRECISION,

            longitude DOUBLE PRECISION,

            geom geometry(Point,4326),

            updated_at timestamptz NOT NULL DEFAULT now()

        )

        `);

        await client.query(`

        CREATE INDEX IF NOT EXISTS carparks_geom_gist

        ON carparks

        USING GIST(geom)

        `);

        console.log("Downloading LTA carparks...");

        const response = await fetch(
            DATA_MALL_URL,
            {
                headers: {
                    AccountKey: accountKey,
                    accept: "application/json"
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                `LTA returned ${response.status}`
            );

        }

        const json = await response.json();

        const carparks = json.value;

        console.log(
            `Downloaded ${carparks.length} carparks.`
        );

        await client.query("BEGIN");

        await client.query(
            "TRUNCATE TABLE carparks"
        );

        let inserted = 0;

        for (const cp of carparks) {

            if (!cp.Location)
                continue;

            const parts =
                cp.Location
                    .trim()
                    .split(" ");

            if (parts.length !== 2)
                continue;

            const latitude =
                Number(parts[0]);

            const longitude =
                Number(parts[1]);

            await client.query(

                `

                INSERT INTO carparks(
                    carpark_id,
                    area,
                    development,
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
                ON CONFLICT (carpark_id)
                DO UPDATE SET
                    area = EXCLUDED.area,
                    development = EXCLUDED.development,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    geom = EXCLUDED.geom,
                    updated_at = now();

                `,

                [

                    cp.CarParkID,

                    cp.Area,

                    cp.Development,

                    latitude,

                    longitude

                ]

            );

            inserted++;

            if (inserted % 250 === 0) {

                console.log(
                    `Inserted ${inserted}`
                );

            }

        }

        await client.query("COMMIT");

        console.log(
            `Finished. ${inserted} inserted.`
        );

    }

    catch (err) {

        await client.query("ROLLBACK");

        throw err;

    }

    finally {

        await client.end();

    }

}

main().catch(console.error);