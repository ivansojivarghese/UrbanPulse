import axios from "axios";

const BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice";

const ACCOUNT_KEY = process.env.LTA_DATA_MALL_ACCOUNT_KEY;

if (!ACCOUNT_KEY) {
    throw new Error("Missing LTA_DATA_MALL_ACCOUNT_KEY");
}

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        AccountKey: ACCOUNT_KEY,
        accept: "application/json"
    },
    timeout: 10000
});

/**
 * Generic GET helper for LTA DataMall.
 */
async function ltaGet<T>(
    endpoint: string,
    params?: Record<string, any>
): Promise<T> {

    const response = await client.get(endpoint, {
        params
    });

    return response.data as T;
}

/* -------------------------------------------------------------------------- */
/*                                  Bus Stops                                 */
/* -------------------------------------------------------------------------- */

export async function getBusStops(skip = 0, top = 500) {

    return ltaGet<{
        value: any[];
    }>("/BusStops", {
        $skip: skip,
        $top: top
    });

}

/* -------------------------------------------------------------------------- */
/*                            Car Park Availability                           */
/* -------------------------------------------------------------------------- */

export interface LTACarpark {

    CarParkID: string;

    Area: string;

    Development: string;

    Location: string;

    AvailableLots: number;

    LotType: string;

    Agency: string;

}

export async function getLTACarparkAvailability(): Promise<LTACarpark[]> {

    const data = await ltaGet<{
        value: LTACarpark[];
    }>("/CarParkAvailabilityv2");

    return data.value;

}

/* -------------------------------------------------------------------------- */
/*                          Convenience Lookup Map                            */
/* -------------------------------------------------------------------------- */
/*
export async function getLTACarparkMap() {

    const carparks = await getLTACarparkAvailability();

    const map = new Map<string, LTACarpark>();

    for (const cp of carparks) {

        // map.set(cp.CarParkID, cp);

        const existing =
            map.get(cp.CarParkID) ?? [];

        existing.push(cp);

        map.set(
            cp.CarParkID,
            existing
        );

    }

    return map;

}*/

export async function getLTACarparkMap() {

    const carparks = await getLTACarparkAvailability();

    const map = new Map<string, LTACarpark[]>();

    for (const cp of carparks) {

        const existing = map.get(cp.CarParkID) ?? [];

        existing.push(cp);

        map.set(cp.CarParkID, existing);
    }

    return map;
}