import axios from "axios";

const BASE_URL = "https://api.data.gov.sg";

const API_KEY = process.env.DATA_GOV_API_KEY;

if (!API_KEY) {
    throw new Error("Missing DATA_GOV_API_KEY");
}

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "x-api-key": API_KEY,
        accept: "application/json"
    }
});

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface DataGovLot {

    lot_type: string;

    lots_available: string;

    total_lots: string;

}

export interface DataGovCarpark {

    carpark_number: string;

    update_datetime: string;

    carpark_info: DataGovLot[];

}

interface DataGovResponse {

    items: {

        timestamp: string;

        carpark_data: DataGovCarpark[];

    }[];

}

/* -------------------------------------------------------------------------- */
/*                            Carpark Availability                            */
/* -------------------------------------------------------------------------- */

export async function getDataGovCarparkAvailability(): Promise<DataGovCarpark[]> {

    const response = await client.get<DataGovResponse>(
        "/v1/transport/carpark-availability"
    );

    console.log(JSON.stringify(response.data, null, 2));

    if (
        !response.data.items ||
        response.data.items.length === 0
    ) {
        return [];
    }

    return response.data.items[0].carpark_data;
}

/* -------------------------------------------------------------------------- */
/*                               Lookup by ID                                */
/* -------------------------------------------------------------------------- */

export async function getDataGovCarparkMap() {

    const carparks = await getDataGovCarparkAvailability();

    const map = new Map<string, DataGovCarpark>();

    for (const cp of carparks) {

        map.set(cp.carpark_number, cp);

    }

    return map;
}

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

export function getAvailableLots(
    cp?: DataGovCarpark
): number {

    if (!cp)
        return 0;

    return cp.carpark_info.reduce(

        (sum, lot) =>

            sum + Number(lot.lots_available),

        0

    );

}

export function getTotalLots(
    cp?: DataGovCarpark
): number {

    if (!cp)
        return 0;

    return cp.carpark_info.reduce(

        (sum, lot) =>

            sum + Number(lot.total_lots),

        0

    );

}