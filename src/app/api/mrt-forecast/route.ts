import { NextRequest, NextResponse } from "next/server";
import { getForecastForStation } from "@/lib/pulse/mrt";

export async function GET(request: NextRequest) {

    const stationId =
        request.nextUrl.searchParams.get("stationId");

    if (!stationId) {

        return NextResponse.json(
            { error: "stationId is required" },
            { status: 400 }
        );

    }

    try {

        const forecast =
            await getForecastForStation(stationId);

        return NextResponse.json(forecast);

    } catch (error) {

        console.error(
            `Failed to fetch MRT forecast for ${stationId}`,
            error
        );

        return NextResponse.json(
            { error: "Failed to fetch MRT forecast" },
            { status: 500 }
        );

    }

}