/*
import { NextRequest, NextResponse } from "next/server";

import {

    getTaxiAvailability,

    getNearbyTaxis

} from "@/lib/taxi";

export async function GET(req: NextRequest) {

    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    const radius =
        Number(searchParams.get("radius")) || 500;

    const taxis =
        await getTaxiAvailability();

    const nearby =
        getNearbyTaxis(

            taxis,

            lat,

            lng,

            radius

        );

    const areaSqKm =
        Math.PI * Math.pow(radius / 1000, 2);

    const density =
        nearby.length / areaSqKm;

    return NextResponse.json({

        count: nearby.length,

        radius,

        areaSqKm,

        density,

        results: nearby

    });

}
    */