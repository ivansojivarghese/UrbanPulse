import axios from "axios";
import { haversineDistance, pointToSegmentDistance } from "@/lib/distance";

const BASE_URL =
    "https://datamall2.mytransport.sg/ltaodataservice/v4";

const ACCOUNT_KEY =
    process.env.LTA_DATA_MALL_ACCOUNT_KEY!;

const client = axios.create({

    baseURL: BASE_URL,

    headers: {

        AccountKey: ACCOUNT_KEY,

        accept: "application/json"

    }

});

export interface TrafficSpeedBand {

    LinkID: string;

    RoadName: string;

    RoadCategory: string;

    SpeedBand: number;

    MinimumSpeed: string;

    MaximumSpeed: string;

    StartLat: string;

    StartLon: string;

    EndLat: string;

    EndLon: string;

}

interface TrafficSpeedBandResponse {

    value: TrafficSpeedBand[];

    lastUpdatedTime: string;

}

export async function getTrafficSpeedBands() {

    const response =
        await client.get<TrafficSpeedBandResponse>(
            "/TrafficSpeedBands"
        );

    return response.data;

}

export function getNearbyTrafficSpeedBands(

    roads: TrafficSpeedBand[],

    lat: number,

    lng: number,

    radius: number

) {

    return roads

        .map(road => {

            /*
            const startDistance =
                haversineDistance(

                    lat,

                    lng,

                    Number(road.StartLat),

                    Number(road.StartLon)

                );

            const endDistance =
                haversineDistance(

                    lat,

                    lng,

                    Number(road.EndLat),

                    Number(road.EndLon)

                );

            const distance =
                Math.min(
                    startDistance,
                    endDistance
                );*/
            /*
            const distance =
                pointToSegmentDistance(

                    lat,
                    lng,

                    Number(road.StartLat),
                    Number(road.StartLon),

                    Number(road.EndLat),
                    Number(road.EndLon)

                );*/

            const startDistance = haversineDistance(
                lat,
                lng,
                Number(road.StartLat),
                Number(road.StartLon)
            );

            const midLat =
                (Number(road.StartLat) + Number(road.EndLat)) / 2;

            const midLon =
                (Number(road.StartLon) + Number(road.EndLon)) / 2;

            const midDistance = haversineDistance(
                lat,
                lng,
                midLat,
                midLon
            );

            const endDistance = haversineDistance(
                lat,
                lng,
                Number(road.EndLat),
                Number(road.EndLon)
            );

            const distance = Math.min(
                startDistance,
                midDistance,
                endDistance
            );

            return {

                linkId:
                    road.LinkID,

                roadName:
                    road.RoadName,

                roadCategory:
                    road.RoadCategory,

                speedBand:
                    road.SpeedBand,

                minimumSpeed:
                    Number(
                        road.MinimumSpeed
                    ),

                maximumSpeed:
                    Number(
                        road.MaximumSpeed
                    ),

                start: {

                    latitude:
                        Number(
                            road.StartLat
                        ),

                    longitude:
                        Number(
                            road.StartLon
                        )

                },

                end: {

                    latitude:
                        Number(
                            road.EndLat
                        ),

                    longitude:
                        Number(
                            road.EndLon
                        )

                },

                distance

            };

        })

        .filter(

            road =>

                road.distance <= radius

        )

        .sort(

            (a, b) =>

                a.distance - b.distance

        );

}