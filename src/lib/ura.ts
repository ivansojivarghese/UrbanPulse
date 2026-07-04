import axios from "axios";

import {
    getToken,
    setToken,
    clearToken
} from "./uraToken";

const BASE =
    "https://eservice.ura.gov.sg/uraDataService";

const ACCESS_KEY =
    process.env.URA_ACCESS_KEY!;

async function refreshToken(): Promise<string> {

    console.log("Refreshing URA token...");

    const response = await axios.get(
        `${BASE}/insertNewToken/v1`,
        {
            headers: {
                AccessKey: ACCESS_KEY
            }
        }
    );

    const token =
        response.data?.Result;

    if (!token) {
        throw new Error(
            "Unable to obtain URA token."
        );
    }

    setToken(token);

    return token;
}

async function getValidToken() {

    let token = getToken();

    if (!token) {
        token = await refreshToken();
    }

    return token;
}

async function uraRequest(service: string) {

    let token =
        await getValidToken();

    try {

        const response =
            await axios.get(
                `${BASE}/invokeUraDS/v1`,
                {
                    headers: {
                        AccessKey: ACCESS_KEY,
                        Token: token
                    },
                    params: {
                        service
                    }
                }
            );

        return response.data;

    } catch (err: any) {

        //
        // URA occasionally invalidates tokens early.
        //

        if (
            err.response?.status === 401 ||
            err.response?.status === 403
        ) {

            clearToken();

            token =
                await refreshToken();

            const retry =
                await axios.get(
                    `${BASE}/invokeUraDS/v1`,
                    {
                        headers: {
                            AccessKey: ACCESS_KEY,
                            Token: token
                        },
                        params: {
                            service
                        }
                    }
                );

            return retry.data;
        }

        throw err;
    }
}

/**
 * Live availability
 */
export async function getAvailability() {

    return uraRequest(
        "Car_Park_Availability"
    );
}

/**
 * Static metadata
 */
export async function getDetails() {

    return uraRequest(
        "Car_Park_Details"
    );
}

/**
 * Merge both APIs
 */
export async function getMergedCarparks() {

    const [availability, details] =
        await Promise.all([
            getAvailability(),
            getDetails()
        ]);

    const detailsMap = new Map<string, any>();

    //
    // Key = ppCode
    //
    for (const cp of details.Result ?? []) {
        detailsMap.set(cp.ppCode, cp);
    }

    const merged = [];

    //
    // Availability uses carparkNo
    //
    for (const live of availability.Result ?? []) {

        const detail =
            detailsMap.get(live.carparkNo);

        merged.push({

            ppCode: live.carparkNo,

            ...(detail ?? {}),

            ...live

        });

    }

    return merged;


    /*
    const [availability, details] =
        await Promise.all([
            getAvailability(),
            getDetails()
        ]);

    const detailsMap =
        new Map<string, any>();

    for (const cp of details.Result ?? []) {
        detailsMap.set(cp.ppCode, cp);
    }

    const merged = [];

    for (const live of availability.Result ?? []) {

        const detail =
            detailsMap.get(live.carparkNo);

        merged.push({

            ppCode: live.carparkNo,

            detailFound: !!detail,

            ...(detail ?? {}),

            ...live

        });

    }*/

    //console.log("Details sample:");
    //console.log(details.Result?.[0]);

        /*
    for (const cp of details.Result ?? []) {

        detailsMap.set(
            cp.ppCode,
            cp
        );

    }

    const merged = []; 
    */

    //console.log("Availability sample:");
    //console.log(availability.Result?.[0]);

    /*
    for (const live of availability.Result ?? []) {

        merged.push({

            ...detailsMap.get(
                live.ppCode
            ),

            ...live

        });

    }

    const detailIds = new Set(
    details.Result.map((x: any) => x.ppCode)
);
*/
/*
const liveIds = new Set(
    availability.Result.map((x: any) => x.carparkNo)
);

let matches = 0;

for (const id of liveIds) {
    if (detailIds.has(id)) matches++;
}

console.log("Details:", detailIds.size);
console.log("Availability:", liveIds.size);
console.log("Matching IDs:", matches);
*/

    // return merged;
}