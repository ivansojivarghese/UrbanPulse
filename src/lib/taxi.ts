/*
import axios from "axios";

const BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

const ACCOUNT_KEY = process.env.LTA_ACCOUNT_KEY!;

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        AccountKey: ACCOUNT_KEY,
        accept: "application/json"
    }
});

export interface Taxi {

    Latitude: number;

    Longitude: number;

}

interface TaxiResponse {

    value: Taxi[];

}

export async function getTaxiAvailability(): Promise<Taxi[]> {

    const response = await client.get<TaxiResponse>(
        "/Taxi-Availability"
    );

    return response.data.value;

}

import { haversineDistance } from "@/lib/distance";

export function getNearbyTaxis(
    taxis: Taxi[],
    lat: number,
    lng: number,
    radius: number
) {

    return taxis
        .map(taxi => {

            const distance = haversineDistance(

                lat,

                lng,

                taxi.Latitude,

                taxi.Longitude

            );

            return {

                latitude: taxi.Latitude,

                longitude: taxi.Longitude,

                distance

            };

        })
        .filter(x => x.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

}
        */