import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/ds";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  const radius =
    Number(searchParams.get("radius")) || 500;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      {
        error: "Missing lat/lng",
      },
      {
        status: 400,
      }
    );
  }

  // console.log(pool)

  const result = await pool.query(
    `
    SELECT
      bus_stop_code,
      road_name,
      description,
      latitude,
      longitude,

      ST_Distance(
        geom::geography,
        ST_SetSRID(
          ST_MakePoint($2,$1),
          4326
        )::geography
      ) AS distance

    FROM bus_stops

    WHERE ST_DWithin(
      geom::geography,
      ST_SetSRID(
        ST_MakePoint($2,$1),
        4326
      )::geography,
      $3
    )

    ORDER BY distance
    `,
    [lat, lng, radius]
  );

  // console.log(result)

  return NextResponse.json(result.rows);
}