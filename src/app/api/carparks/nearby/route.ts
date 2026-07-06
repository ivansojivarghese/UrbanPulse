import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/ds";

import { haversineDistance } from "@/lib/distance";

import {
    getMergedHDBCarparks,
    getURACapacityMap
} from "@/lib/dataGov";

import {
    getLTACapacityMap,
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

                uraCapacityMap,

                hdbCarparks

            ] = await Promise.all([

                getLTACarparkMap(),

                getDataGovCarparkMap(),

                getMergedCarparks(),

                getURACapacityMap(),

                getMergedHDBCarparks()

            ]);

            const ltaCapacityMap = getLTACapacityMap(); 
    
            /*
            const uraMap = new Map<string, any>();

            for (const cp of uraCarparks) {
                uraMap.set(cp.ppCode, cp);
            }*/

            const uraMap = new Map<string, any[]>();

            for (const cp of uraCarparks) {

                const existing =
                    uraMap.get(cp.ppCode) ?? [];

                existing.push(cp);

                uraMap.set(
                    cp.ppCode,
                    existing
                );

            }
/*
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
            .filter(cp => cp.distance <= radius);*/

            const nearbyHDB = hdbCarparks
    .map(cp => {

        const distance = haversineDistance(
            lat,
            lng,
            cp.latitude,
            cp.longitude
        );

        const car =
            cp.carpark_info.find(x => x.lot_type === "C");

        const motorcycle =
            cp.carpark_info.find(x => x.lot_type === "Y");

        const heavy =
            cp.carpark_info.find(x => x.lot_type === "H");

        const carCapacity = car ? Number(car.total_lots) : null;
        const bikeCapacity = motorcycle ? Number(motorcycle.total_lots) : null;
        const heavyCapacity = heavy ? Number(heavy.total_lots) : null;

        const carAvailable = car ? Number(car.lots_available) : null;
        const bikeAvailable = motorcycle ? Number(motorcycle.lots_available) : null;
        const heavyAvailable = heavy ? Number(heavy.lots_available) : null;


        // console.log(ltaMap);

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

            
            lots: {

                    car: {

                        available:
                            carAvailable === 0 && carCapacity == null
                                ? null
                                : carAvailable,

                        capacity:
                            carCapacity == null && carAvailable === 0
                                ? null
                                : carCapacity

                    },

                    motorcycle: {

                        available:
                            bikeAvailable === 0 && bikeCapacity == null
                                ? null
                                : bikeAvailable,

                        capacity:
                            bikeCapacity == null && bikeAvailable === 0
                                ? null
                                : bikeCapacity

                    },

                    heavyVehicle: {

                        available:
                            heavyAvailable === 0 && heavyCapacity == null
                                ? null
                                : heavyAvailable,

                        capacity:
                            heavyCapacity == null && heavyAvailable === 0
                                ? null
                                : heavyCapacity

                },

                /*
                car: {

                    available: car
                        ? Number(car.lots_available)
                        : null,

                    capacity: car
                        ? Number(car.total_lots)
                        : null

                },

                motorcycle: {

                    available: motorcycle
                        ? Number(motorcycle.lots_available)
                        : null,

                    capacity: motorcycle
                        ? Number(motorcycle.total_lots)
                        : null

                },

                heavyVehicle: {

                    available: heavy
                        ? Number(heavy.lots_available)
                        : null,

                    capacity: heavy
                        ? Number(heavy.total_lots)
                        : null

                }
                */

                /*
                car: {

                    available: getAvailableLots(cp),

                    capacity: getTotalLots(cp)

                },

                motorcycle: {

                    available: null,

                    capacity: null

                },

                heavyVehicle: {

                    available: null,

                    capacity: null

                }*/

            },

            lta: null,

            ura: null,

            dataGov: cp

        };

    })
    .filter(cp => cp.distance <= radius);

        /* ---------------------------------------------------- */
        /* Merge                                                */
        /* ---------------------------------------------------- */

        /*
        const merged = nearby.map(cp => {

            
            // const lta = ltaMap.get(cp.carpark_id);
            const lta = ltaMap.get(cp.carpark_id);
            const dg = dataGovMap.get(cp.carpark_id);
            const ura = uraMap.get(cp.carpark_id);

            const ltaLots = {
                C: 0,
                Y: 0,
                H: 0
            };

            const records =
                ltaMap.get(cp.carpark_id) ?? [];

            for (const r of records) {
                ltaLots[r.LotType] =
                    Number(r.AvailableLots);
            }

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

                lots: ura ? {

                    car: {

                        capacity:
                            ura.NO_CAR,

                        available:
                            ltaLots.C

                    },

                    motorcycle: {

                        capacity:
                            ura.NO_MCYCLE,

                        available:
                            ltaLots.Y

                    },

                    heavyVehicle: {

                        capacity:
                            ura.NO_H_VEHIC,

                        available:
                            ltaLots.H

                    }

                } : null,

                lta,
                ura,
                dataGov: dg
            };
        });
        */

        const merged = nearby.map(cp => {

            // console.log(cp.carpark_id);

        const records = ltaMap.get(cp.carpark_id) ?? [];

        const ltaCapacity = ltaCapacityMap.get(cp.carpark_id);

        // console.log(records)

        const dg = dataGovMap.get(cp.carpark_id);
        // const ura = uraMap.get(cp.carpark_id);
        const uraRecords =
            uraMap.get(cp.carpark_id) ?? [];

        const capacity =
            uraCapacityMap.get(cp.carpark_id);

        const ltaLots = {
            C: 0,
            Y: 0,
            H: 0
        };

        let agency: string | null = null;

        for (const r of records) {

            if (r.LotType === "C")
                ltaLots.C = Number(r.AvailableLots);

            else if (r.LotType === "Y")
                ltaLots.Y = Number(r.AvailableLots);

            else if (r.LotType === "H")
                ltaLots.H = Number(r.AvailableLots);

            agency = r.Agency;
        }

        let availableLots: number | null = null;
        let totalLots: number | null = null;
        let source: string | null = null;

        if (capacity) {

            availableLots =
                ltaLots.C +
                ltaLots.Y +
                ltaLots.H;

            totalLots =
                Number(capacity.NO_CAR) +
                Number(capacity.NO_MCYCLE) +
                Number(capacity.NO_H_VEHIC);

            source = "URA";

        }
        else if (dg) {

            availableLots = getAvailableLots(dg);
            totalLots = getTotalLots(dg);
            source = "DataGov";

        }
        else if (records.length > 0) {

            availableLots =
                ltaLots.C +
                ltaLots.Y +
                ltaLots.H;

            totalLots = ltaCapacity?.RoundedMaxObservedLots ?? ltaCapacity?.ActualMaxObservedLots ?? null;

            source = "LTA";
        }

        //const carCapacity = capacity?.NO_CAR;
        //const bikeCapacity = capacity?.NO_MCYCLE;
        //const heavyCapacity = capacity?.NO_H_VEHIC;

        const carCapacity =
    capacity?.NO_CAR ?? null;
        const bikeCapacity =
    capacity?.NO_MCYCLE ?? null;
    const heavyCapacity =
        capacity?.NO_H_VEHIC ?? null;

        const carAvailable = ltaLots.C;
        const bikeAvailable = ltaLots.Y;
        const heavyAvailable = ltaLots.H;

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

            /*
            lots: {

                car: {

                    available: ltaLots.C,
                    capacity: capacity?.NO_CAR ?? null

                },

                motorcycle: {

                    available: ltaLots.Y,
                    capacity: capacity?.NO_MCYCLE ?? null

                },

                heavyVehicle: {

                    available: ltaLots.H,
                    capacity: capacity?.NO_H_VEHIC ?? null

                }

            },*/

            lots: {

                car: {

                    available:
                        carAvailable === 0 && carCapacity == null
                            ? null
                            : carAvailable,

                    capacity:
                        carCapacity == null && carAvailable === 0
                            ? null
                            : carCapacity

                },

                motorcycle: {

                    available:
                        bikeAvailable === 0 && bikeCapacity == null
                            ? null
                            : bikeAvailable,

                    capacity:
                        bikeCapacity == null && bikeAvailable === 0
                            ? null
                            : bikeCapacity

                },

                heavyVehicle: {

                    available:
                        heavyAvailable === 0 && heavyCapacity == null
                            ? null
                            : heavyAvailable,

                    capacity:
                        heavyCapacity == null && heavyAvailable === 0
                            ? null
                            : heavyCapacity

                }

            },

            lta: records,

            ura: uraRecords,

            capacity,

            dataGov: dg,

            agency

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