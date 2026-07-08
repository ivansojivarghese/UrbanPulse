import {

    NextRequest,

    NextResponse

} from "next/server";

import {

    getBusArrival

} from "@/lib/busArrival";

export async function GET(

    req: NextRequest

) {

    const { searchParams } =
        new URL(req.url);

    const busStopCode =
        searchParams.get(
            "busStopCode"
        );

    if (!busStopCode) {

        return NextResponse.json(

            {

                error:
                    "busStopCode is required"

            },

            {

                status: 400

            }

        );

    }

    try {

        const arrival =
            await getBusArrival(
                busStopCode
            );

        return NextResponse.json(
            arrival
        );

    }

    catch (err: any) {

        return NextResponse.json(

            {

                error:
                    err.message

            },

            {

                status: 500

            }

        );

    }

}