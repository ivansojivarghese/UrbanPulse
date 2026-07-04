import pg from "pg";
import dotenv from "dotenv";

dotenv.config({
    path: ".env.local"
});

const { Client } = pg;

const DATASET_ID =
    "d_9bf8620ecfdc8a5f8f77e3f02160af5c";

async function downloadDataset() {

    console.log("Polling Data.gov...");

    const poll = await fetch(
        `https://api-open.data.gov.sg/v1/public/api/datasets/${DATASET_ID}/poll-download`
    );

    if (!poll.ok)
        throw new Error("Unable to poll dataset");

    const pollJson = await poll.json();

    if (pollJson.code !== 0)
        throw new Error(pollJson.errMsg);

    const url = pollJson.data.url;

    console.log("Downloading dataset...");

    const response = await fetch(url);

    if (!response.ok)
        throw new Error("Unable to download dataset");

    return await response.json();
}

async function main() {

    console.log("========== URA CARPARK SYNC ==========");

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl)
        throw new Error("DATABASE_URL missing");

    const client = new Client({
        connectionString: databaseUrl
    });

    console.log("Connecting PostgreSQL...");

    await client.connect();

    console.log("Connected.");

    try {

        await client.query(
            "CREATE EXTENSION IF NOT EXISTS postgis"
        );

        console.log("Creating table...");

        await client.query(`

        CREATE TABLE IF NOT EXISTS ura_carparks (

            pp_code TEXT PRIMARY KEY,

            parking_place TEXT,

            no_car INTEGER,

            no_heavy_vehicle INTEGER,

            no_motorcycle INTEGER,

            latitude DOUBLE PRECISION,

            longitude DOUBLE PRECISION,

            geom geometry(Point,4326),

            updated_at timestamptz DEFAULT now()

        )

        `);

        await client.query(`

        CREATE INDEX IF NOT EXISTS ura_carparks_geom_gist

        ON ura_carparks

        USING GIST(geom)

        `);

        const geojson = await downloadDataset();

        const features = geojson.features;

        console.log(
            `Downloaded ${features.length} URA carparks`
        );

        await client.query("BEGIN");

        await client.query(
            "TRUNCATE ura_carparks"
        );

        let inserted = 0;

        for (const feature of features) {

            const p = feature.properties;

            const coordinates =
                feature.geometry.coordinates;

            const longitude = coordinates[0];
            const latitude = coordinates[1];

            await client.query(

                `

                INSERT INTO ura_carparks(

                    pp_code,

                    parking_place,

                    no_car,

                    no_heavy_vehicle,

                    no_motorcycle,

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
                    $6,
                    $7,

                    ST_SetSRID(
                        ST_MakePoint($7,$6),
                        4326
                    ),

                    now()

                )

                ON CONFLICT(pp_code)

                DO UPDATE SET

                    parking_place=EXCLUDED.parking_place,
                    no_car=EXCLUDED.no_car,
                    no_heavy_vehicle=EXCLUDED.no_heavy_vehicle,
                    no_motorcycle=EXCLUDED.no_motorcycle,
                    latitude=EXCLUDED.latitude,
                    longitude=EXCLUDED.longitude,
                    geom=EXCLUDED.geom,
                    updated_at=now()

                `,

                [

                    p.PP_CODE,
                    p.PARKING_PL,
                    p.NO_CAR,
                    p.NO_H_VEHIC,
                    p.NO_MCYCLE,
                    latitude,
                    longitude

                ]

            );

            inserted++;

            if (inserted % 500 === 0)
                console.log(`Inserted ${inserted}`);

        }

        await client.query("COMMIT");

        console.log(
            `Finished. ${inserted} URA carparks inserted.`
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