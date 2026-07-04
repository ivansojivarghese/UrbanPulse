import { NextRequest, NextResponse } from "next/server";
import { getNearestMRT } from "@/lib/onemap";

export async function GET(req: NextRequest) {

    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius =
        Number(searchParams.get("radius")) || 1000;

    if (isNaN(lat) || isNaN(lng)) {

        return NextResponse.json(
            {
                error: "Missing latitude or longitude"
            },
            {
                status: 400
            }
        );

    }

    const result = await getNearestMRT(
        lat,
        lng,
        radius
    );

    return NextResponse.json(result);
}