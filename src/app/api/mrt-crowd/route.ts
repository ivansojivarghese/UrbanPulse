import { NextRequest, NextResponse } from "next/server";
import { getCrowdForStation } from "@/lib/pulse/mrt";

export async function GET(req: NextRequest) {

    const stationId =
        new URL(req.url)
            .searchParams
            .get("stationId");

    if (!stationId) {
        return NextResponse.json(
            { error: "stationId is required" },
            { status: 400 }
        );
    }

    try {

        const crowd =
            await getCrowdForStation(stationId);

        return NextResponse.json(crowd);

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            { error: "Failed to retrieve MRT crowd data" },
            { status: 500 }
        );

    }
}