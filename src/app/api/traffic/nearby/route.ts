import {
    NextRequest,
    NextResponse
} from "next/server";

import {

    getTrafficSpeedBands,

    getNearbyTrafficSpeedBands

} from "@/lib/traffic";

export async function GET(
    req: NextRequest
) {

    const { searchParams } =
        new URL(req.url);

    const lat =
        Number(searchParams.get("lat"));

    const lng =
        Number(searchParams.get("lng"));

    const radius =
        Number(
            searchParams.get("radius")
        ) || 500;

    if (

        Number.isNaN(lat) ||

        Number.isNaN(lng)

    ) {

        return NextResponse.json(

            {

                error:
                    "Missing lat/lng"

            },

            {

                status: 400

            }

        );

    }

    const data =
        await getTrafficSpeedBands();

    const nearby =
        getNearbyTrafficSpeedBands(

            data.value,

            lat,

            lng,

            radius

        );

    return NextResponse.json({

        count:
            nearby.length,

        radius,

        lastUpdatedTime:
            data.lastUpdatedTime,

        results:
            nearby

    });

}