import axios from "axios";

import { svy21ToWGS84 } from "./svy21";

const BASE_URL = "https://api.data.gov.sg";
// const BASE_URL = process.env.DATA_GOV_BASE_URL;

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

const openClient = axios.create({
    baseURL: "https://api-open.data.gov.sg",
    timeout: 10000,
    headers: {
        "x-api-key": API_KEY,
        accept: "application/json"
    }
});

const HDB_METADATA_DATASET =
    "d_23f946fa557947f93a8043bbef41dd09";

/* -------------------------------------------------------------------------- */
/*                              Live Availability                             */
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

export interface URACapacity {

    PP_CODE: string;

    NO_CAR: number;

    NO_MCYCLE: number;

    NO_H_VEHIC: number;

}

interface DataGovResponse {

    items: {

        timestamp: string;

        carpark_data: DataGovCarpark[];

    }[];

}

/* -------------------------------------------------------------------------- */
/*                             Metadata Dataset                               */
/* -------------------------------------------------------------------------- */
/*
export interface DataGovMetadata {

    car_park_no: string;

    address: string;

    x_coord: string;

    y_coord: string;

    latitude: string;

    longitude: string;

    car_park_type: string;

    type_of_parking_system: string;

    short_term_parking: string;

    free_parking: string;

    night_parking: string;

}*/

export interface DataGovMetadata {

    car_park_no: string;

    address: string;

    x_coord: string;

    y_coord: string;

    car_park_type: string;

    type_of_parking_system: string;

    short_term_parking: string;

    free_parking: string;

    night_parking: string;

    car_park_decks: string;

    gantry_height: string;

    car_park_basement: string;

}

/* -------------------------------------------------------------------------- */

export interface MergedHDBCarpark
    extends DataGovMetadata,
        DataGovCarpark {
            latitude: number;

            longitude: number;
        }

/* -------------------------------------------------------------------------- */
/*                          Live HDB Availability API                          */
/* -------------------------------------------------------------------------- */

export async function getDataGovCarparkAvailability(): Promise<DataGovCarpark[]> {

    const response =
        await client.get<DataGovResponse>(
            "/v1/transport/carpark-availability"
        );

    if (
        !response.data.items ||
        response.data.items.length === 0
    ) {
        return [];
    }

    return response.data.items[0].carpark_data;

}

export interface URACapacityFeature {
    properties: {
        PP_CODE: string;
        NO_CAR: number;
        NO_MCYCLE: number;
        NO_H_VEHIC: number;
    };
}

export async function getURACapacityDataset(): Promise<URACapacityFeature[]> {

    const datasetId = "d_9bf8620ecfdc8a5f8f77e3f02160af5c";

    // Step 1: obtain temporary download URL
    const poll = await openClient.get(
        `/v1/public/api/datasets/${datasetId}/poll-download`
    );

    const downloadUrl = poll.data.data.url;

    // Step 2: download GeoJSON
    const geojson = await axios.get(downloadUrl);

    return geojson.data.features;
}

export async function getURACapacityMap() {

    const features = await getURACapacityDataset();

    const map = new Map<string, URACapacity>();

    for (const f of features) {

        map.set(f.properties.PP_CODE, {

            PP_CODE: f.properties.PP_CODE,

            NO_CAR: Number(f.properties.NO_CAR),

            NO_MCYCLE: Number(f.properties.NO_MCYCLE),

            NO_H_VEHIC: Number(f.properties.NO_H_VEHIC)

        });

    }

    return map;

}

/* -------------------------------------------------------------------------- */
/*                           HDB Metadata Dataset                             */
/* -------------------------------------------------------------------------- */
/*
export async function getDataGovMetadata(): Promise<DataGovMetadata[]> {

    const all: DataGovMetadata[] = [];

    const limit = 500;

    let offset = 0;

    while (true) {

        const response =
            await axios.get(
                "https://data.gov.sg/api/action/datastore_search",
                {
                    params: {
                        resource_id:
                            HDB_METADATA_DATASET,
                        limit,
                        offset
                    }
                }
            );

        const records =
            response.data.result.records as DataGovMetadata[];

        all.push(...records);

        console.log(
            `Downloaded ${all.length} metadata rows`
        );

        if (records.length < limit)
            break;

        offset += limit;

    }

    return all;

}
*/

import { parse } from "csv-parse/sync";

export async function getDataGovMetadata(): Promise<DataGovMetadata[]> {

    const datasetId =
        "d_23f946fa557947f93a8043bbef41dd09";

    //
    // Step 1: Get download URL
    //
    const poll = await axios.get(
        `https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/poll-download`
    );

    if (poll.data.code !== 0) {
        throw new Error(
            poll.data.errMsg ??
            "Unable to obtain download URL."
        );
    }

    //
    // Step 2: Download CSV
    //
    const csv = await axios.get(
        poll.data.data.url,
        {
            responseType: "text"
        }
    );

    //
    // Step 3: Parse CSV
    //
    const rows = parse(csv.data, {
        columns: [
            "car_park_no",
            "address",
            "x_coord",
            "y_coord",
            "car_park_type",
            "type_of_parking_system",
            "short_term_parking",
            "free_parking",
            "night_parking",
            "car_park_decks",
            "gantry_height",
            "car_park_basement"
        ],
        skip_empty_lines: true,
        trim: true
    });

    return rows as DataGovMetadata[];

}

/*
export async function getDataGovMetadata(): Promise<DataGovMetadata[]> {

    const datasetId =
        "d_23f946fa557947f93a8043bbef41dd09";

    //
    // Step 1: Poll for download URL
    //
    const pollResponse = await axios.get(
        `https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/poll-download`
    );

    if (pollResponse.data.code !== 0) {
        throw new Error(
            pollResponse.data.errMsg ??
            "Unable to obtain Data.gov download URL."
        );
    }

    //
    // Step 2: Download dataset
    //
    const downloadUrl =
        pollResponse.data.data.url;

    const download =
        await axios.get(downloadUrl);

    //
    // Step 3: Dataset may be either:
    //  - an array
    //  - { records: [...] }
    //  - { result: [...] }
    //  - { data: [...] }
    //

    const body = download.data;

    console.log(body)

    if (Array.isArray(body)) {
        return body;
    }

    if (Array.isArray(body.records)) {
        return body.records;
    }

    if (Array.isArray(body.result)) {
        return body.result;
    }

    if (Array.isArray(body.data)) {
        return body.data;
    }

    throw new Error(
        "Unknown HDB metadata format."
    );

}
    */

/* -------------------------------------------------------------------------- */
/*                       Merge Metadata + Live Lots                           */
/* -------------------------------------------------------------------------- */

export async function getMergedHDBCarparks(): Promise<MergedHDBCarpark[]> {

    const [

        live,

        metadata

    ] = await Promise.all([

        getDataGovCarparkAvailability(),

        getDataGovMetadata()

    ]);
/*
    console.log(
        `Live: ${live.length}`
    );

    console.log(
        `Metadata: ${metadata.length}`
    );*/

    const metadataMap =
        new Map<string, DataGovMetadata>();

    for (const cp of metadata) {

        metadataMap.set(
            cp.car_park_no,
            cp
        );

    }

    const merged: MergedHDBCarpark[] = [];

    let matched = 0;

    for (const liveCp of live) {

        const meta =
            metadataMap.get(
                liveCp.carpark_number
            );

        if (!meta)
            continue;

        matched++;

        const coord = svy21ToWGS84(
            Number(meta.x_coord),
            Number(meta.y_coord)
        );

        merged.push({

            ...meta,

            latitude: coord.latitude,
            longitude: coord.longitude,

            ...liveCp

        });

    }
/*
    console.log(
        `Matched ${matched} HDB carparks`
    );*/

    return merged;

}

/* -------------------------------------------------------------------------- */
/*                              Lookup Map                                    */
/* -------------------------------------------------------------------------- */

export async function getDataGovCarparkMap() {

    const merged =
        await getMergedHDBCarparks();

    const map =
        new Map<string, MergedHDBCarpark>();

    for (const cp of merged) {

        map.set(
            cp.carpark_number,
            cp
        );

    }

    return map;

}

/* -------------------------------------------------------------------------- */
/*                               Helper Utils                                 */
/* -------------------------------------------------------------------------- */

export function getAvailableLots(
    cp?: DataGovCarpark
): number {

    if (!cp)
        return 0;

    return cp.carpark_info.reduce(

        (sum, lot) =>

            sum +
            Number(lot.lots_available),

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

            sum +
            Number(lot.total_lots),

        0

    );

}