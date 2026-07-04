import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/ds";

import { haversineDistance } from "@/lib/distance";

import {
    getMergedHDBCarparks
} from "@/lib/dataGov";

import {
    getLTACarparkMap
} from "@/lib/lta";

import {
    getDataGovCarparkMap,
    getAvailableLots,
    getTotalLots
} from "@/lib/dataGov";

import { getMergedCarparks } from "@/lib/ura";

export async function GET(req: NextRequest) {

    try {

        const { searchParams } = new URL(req.url);

        const lat = Number(searchParams.get("lat"));
        const lng = Number(searchParams.get("lng"));

        const radius =
            Number(searchParams.get("radius")) || 1000;

        if (Number.isNaN(lat) || Number.isNaN(lng)) {

            return NextResponse.json(
                {
                    error: "lat and lng are required"
                },
                {
                    status: 400
                }
            );

        }

        /* ---------------------------------------------------- */
        /* Query nearby carparks from PostGIS                   */
        /* ---------------------------------------------------- */

        const sql = `

        SELECT

            carpark_id,

            area,

            development,

            latitude,

            longitude,

            ST_DistanceSphere(

                geom,

                ST_SetSRID(
                    ST_MakePoint($2,$1),
                    4326
                )

            ) AS distance

        FROM carparks

        WHERE

            ST_DWithin(

                geom::geography,

                ST_SetSRID(
                    ST_MakePoint($2,$1),
                    4326
                )::geography,

                $3

            )

        ORDER BY

            geom <-> ST_SetSRID(
                ST_MakePoint($2,$1),
                4326
            )

        LIMIT 50

        `;

        const result = await pool.query(
            sql,
            [
                lat,
                lng,
                radius
            ]
        );

        const nearby = result.rows;

        /* ---------------------------------------------------- */
        /* Fetch live availability                              */
        /* ---------------------------------------------------- */
            /*
            const [
                ltaMap,
                dataGovMap,
                uraCarparks
            ] = await Promise.all([
                getLTACarparkMap(),
                getDataGovCarparkMap(),
                getMergedCarparks()
            ]);*/

            const [

                ltaMap,

                dataGovMap,

                uraCarparks,

                hdbCarparks

            ] = await Promise.all([

                getLTACarparkMap(),

                getDataGovCarparkMap(),

                getMergedCarparks(),

                getMergedHDBCarparks()

            ]);
    
            const uraMap = new Map<string, any>();

            for (const cp of uraCarparks) {
                uraMap.set(cp.ppCode, cp);
            }

            const nearbyHDB = hdbCarparks
        .map(cp => {

            const distance = haversineDistance(

                lat,

                lng,

                cp.latitude,

                cp.longitude

            );

            return {

                id: cp.carpark_number,

                area: "HDB",

                development: cp.address,

                latitude: cp.latitude,

                longitude: cp.longitude,

                distance,

                availableLots: getAvailableLots(cp),

                totalLots: getTotalLots(cp),

                source: "DataGov",

                lta: null,

                ura: null,

                dataGov: cp

            };

        })
        .filter(cp => cp.distance <= radius);

        /* ---------------------------------------------------- */
        /* Merge                                                */
        /* ---------------------------------------------------- */

        const merged = nearby.map(cp => {

            
            const lta = ltaMap.get(cp.carpark_id);
            const dg = dataGovMap.get(cp.carpark_id);
            const ura = uraMap.get(cp.carpark_id);

            let availableLots = null;
            let totalLots = null;
            let source = null;

            if (ura) {
                availableLots = Number(ura.lotsAvailable);
                totalLots = Number(ura.parkCapacity);
                source = "URA";
            } else if (dg) {
                availableLots = getAvailableLots(dg);
                totalLots = getTotalLots(dg);
                source = "DataGov";
            } else if (lta) {
                availableLots = Number(lta.AvailableLots);
                source = "LTA";
            }

            return {
                id: cp.carpark_id,

                area: cp.area,

                development: cp.development,

                latitude: cp.latitude,

                longitude: cp.longitude,

                distance: Math.round(Number(cp.distance)),

                availableLots,
                totalLots,
                source,

                lta,
                ura,
                dataGov: dg
            };
        });

        const combined = [

            ...merged,

            ...nearbyHDB

        ];

        const unique = new Map();

        for (const cp of combined) {

            if (!unique.has(cp.id)) {

                unique.set(cp.id, cp);

            }

        }

        const results = [...unique.values()]
        .sort(

            (a, b) => a.distance - b.distance

        )
        .slice(0, 50);

        return NextResponse.json({

            count: results.length,

            radius,

            results

        }); 

        /*
        const merged = nearby.map(cp => {

            
            const lta = ltaMap.get(cp.carpark_id);
            const dg = dataGovMap.get(cp.carpark_id);
            const ura = uraMap.get(cp.carpark_id);
            
            return {

                id: cp.carpark_id,

                area: cp.area,

                development: cp.development,

                latitude: cp.latitude,

                longitude: cp.longitude,

                distance: Math.round(
                    Number(cp.distance)
                ),

                lta: lta
                    ? {

                        availableLots:
                            Number(lta.AvailableLots),

                        lotType:
                            lta.LotType,

                        agency:
                            lta.Agency

                    }
                    : null,
                
                dataGov: dg
                    ? {

                        availableLots:
                            getAvailableLots(dg),

                        totalLots:
                            getTotalLots(dg),

                        updatedAt:
                            dg.update_datetime

                    }
                    : null
            };


        });

        return NextResponse.json({

            count: merged.length,

            radius,

            results: merged

        }); */

    }

    catch (err: any) {

        console.error(err);

        return NextResponse.json(

            {

                error: err.message

            },

            {

                status: 500

            }

        );

    }

}