import axios from "axios";

const client = axios.create({
    baseURL: "https://datamall2.mytransport.sg/ltaodataservice",
    headers: {
        AccountKey: process.env.LTA_DATA_MALL_ACCOUNT_KEY,
        accept: "application/json"
    }
});

export interface CrowdRecord {
    Station: string;
    CrowdLevel: string;
    StartTime: string;
    EndTime: string;
}

interface CrowdResponse {
    value: CrowdRecord[];
}

export function getTrainLine(stationId: string): string {

    const id = stationId.toUpperCase();

    // Sengkang LRT
    if (
        id === "STC" ||
        id.startsWith("SE") ||
        id.startsWith("SW")
    ) {
        return "SLRT";
    }

    // Punggol LRT
    if (
        id === "PTC" ||
        id.startsWith("PE") ||
        id.startsWith("PW")
    ) {
        return "PLRT";
    }

    if (
        id.startsWith("JS") ||
        id.startsWith("JE") ||
        id.startsWith("JW")
    ) {
        return "JRL";
    } 

    // NS5 -> NSL
    // EW24 -> EWL
    // DT13 -> DTL
    // TE8 -> TEL
    // CC15 -> CCL
    // CE1 -> CEL
    // NE17 -> NEL
    // BP1 -> BPL

    return `${id.substring(0, 2)}L`;
}

export interface ForecastInterval {
    Start: string;
    CrowdLevel: string;
}

export interface ForecastStation {
    Station: string;
    Interval: ForecastInterval[];
}

export interface ForecastDay {
    Date: string;
    Stations: ForecastStation[];
}

interface ForecastResponse {
    value: ForecastDay[];
}

export interface ForecastRecord {
    Date: string;
    Station: string;
    Start: string;
    CrowdLevel: string;
}

export async function getCrowdForStation(
    stationId: string
): Promise<CrowdRecord | null> {

    const id = stationId.toUpperCase();

    const trainLine = getTrainLine(id);

    const response = await client.get<CrowdResponse>(
        "/PCDRealTime",
        {
            params: {
                TrainLine: trainLine
            }
        }
    );

    return (
        response.data.value.find(
            station =>
                station.Station.toUpperCase() === id
        ) ?? null
    );
}

export async function getForecastForStation(
    stationId: string
): Promise<ForecastInterval[]> {

    const id = stationId.toUpperCase();

    const trainLine = getTrainLine(id);

    const response = await client.get<ForecastResponse>(
        "/PCDForecast",
        {
            params: {
                TrainLine: trainLine
            }
        }
    );

    const day = response.data.value[0];

    if (!day)
        return [];

    const station = day.Stations.find(
        s => s.Station.toUpperCase() === id
    );

    return station?.Interval ?? [];

    //return station ? station.Interval.map(interval => ({ ...interval, Station: station.Station })) : [];
}

interface NearbyStation {
    id: string;
    name: string;
    lat: number;
    lon: number;
    distance?: number;
}

interface CrowdResult {
    station: NearbyStation;
    crowd: {
        CrowdLevel: string;
    } | null;
}

interface ForecastResult {
    station: NearbyStation;
    forecast: ForecastRecord[];
}

/*
export function calculateMRTPulse(
    nearbyStations: NearbyStation[],
    mrtCrowd: CrowdResult[]
): number {

    if (nearbyStations.length === 0)
        return 0;

    let score = 0;

    //--------------------------------------------------
    // Station density
    //--------------------------------------------------

    score += Math.min(nearbyStations.length * 10, 40);

    //--------------------------------------------------
    // Group stations by name (interchanges)
    //--------------------------------------------------

    const groups = new Map<string, NearbyStation[]>();

    for (const station of nearbyStations) {

        const key = station.name.trim().toUpperCase();

        if (!groups.has(key))
            groups.set(key, []);

        groups.get(key)!.push(station);
    }

    //--------------------------------------------------
    // Score each physical station
    //--------------------------------------------------

    for (const stations of groups.values()) {

        // closest platform

        const closestDistance = Math.min(
            ...stations.map(s => s.distance ?? 500)
        );

        // closer station -> larger contribution

        score += Math.max(0, 20 - closestDistance / 25);

        //--------------------------------------------------
        // interchange bonus
        //--------------------------------------------------

        if (stations.length >= 2) {

            score += Math.min(
                (stations.length - 1) * 10,
                20
            );

        }

    }

    //--------------------------------------------------
    // Crowd
    //--------------------------------------------------

    for (const item of mrtCrowd) {

        // console.log(item)

        if (!item?.crowd) {
            score = 0;
            break;
        }

        switch (item.crowd.CrowdLevel.toLowerCase()) {

            case "l":
                score += 1;
                break;

            case "m":
                score += 4;
                break;

            case "h":
                score += 8;
                break;
        }

    }

    return Math.round(
        Math.max(0, Math.min(score, 100))
    );

}*/
/*
export function calculateMRTPulse(
    nearbyStations: NearbyStation[],
    mrtCrowd: CrowdResult[]
): number {

    // Keep only stations that have crowd data
    const activeStationIds = new Set(
        mrtCrowd
            .filter(item => item?.crowd)
            .map(item => item.station.id.toUpperCase())
    );

    const activeStations = nearbyStations.filter(
        station => activeStationIds.has(station.id.toUpperCase())
    );

    if (activeStations.length === 0)
        return 0;

    let score = 0;

    //--------------------------------------------------
    // Station density
    //--------------------------------------------------

    score += Math.min(activeStations.length * 10, 40);

    //--------------------------------------------------
    // Group stations by name (interchanges)
    //--------------------------------------------------

    const groups = new Map<string, NearbyStation[]>();

    for (const station of activeStations) {

        const key = station.name.trim().toUpperCase();

        if (!groups.has(key))
            groups.set(key, []);

        groups.get(key)!.push(station);

    }

    //--------------------------------------------------
    // Distance + interchange
    //--------------------------------------------------

    for (const stations of groups.values()) {

        const closestDistance = Math.min(
            ...stations.map(s => s.distance ?? 500)
        );

        // Maximum 20 points for being right beside station
        score += Math.max(0, 20 - closestDistance / 25);

        // Interchange bonus
        if (stations.length >= 2) {

            score += Math.min(
                (stations.length - 1) * 10,
                20
            );

        }

    }

    //--------------------------------------------------
    // Crowd
    //--------------------------------------------------

    for (const item of mrtCrowd) {

        if (!item?.crowd)
            continue;

        switch (item.crowd.CrowdLevel.toLowerCase()) {

            case "l":
                score += 1;
                break;

            case "m":
                score += 4;
                break;

            case "h":
                score += 8;
                break;

        }

    }

    return Math.round(
        Math.max(0, Math.min(score, 100))
    );

}
    */


export function calculateMRTPulse(
    nearbyStations: NearbyStation[],
    mrtCrowd: CrowdResult[],
    mrtForecast: ForecastResult[]
): number {

    //--------------------------------------------------
    // Build lookup of every active station ID
    //--------------------------------------------------

    const activeIds = new Set<string>();

    for (const item of mrtCrowd) {

        if (!item?.crowd)
            continue;

        item.station.id
            .split("/")
            .map(x => x.trim().toUpperCase())
            .forEach(id => activeIds.add(id));

    }

    //--------------------------------------------------
    // Keep only stations that have at least one active ID
    //--------------------------------------------------

    const activeStations = nearbyStations.filter(station => {

        const ids = station.id
            .split("/")
            .map(x => x.trim().toUpperCase());

        return ids.some(id => activeIds.has(id));

    });

    if (activeStations.length === 0)
        return 0;

    let score = 0;

    //--------------------------------------------------
    // Station density
    //--------------------------------------------------

    const uniqueStations = new Set(
    activeStations.map(
        s => s.name.trim().toUpperCase()
    )
);

// score += Math.min(uniqueStations.size * 10, 40);

score += Math.min(uniqueStations.size * 18, 54);

    // score += Math.min(activeStations.length * 10, 40);

    //--------------------------------------------------
    // Group physical stations
    //--------------------------------------------------

    const groups = new Map<string, NearbyStation[]>();

    for (const station of activeStations) {

        const key = station.name.trim().toUpperCase();

        if (!groups.has(key))
            groups.set(key, []);

        groups.get(key)!.push(station);

    }

    //--------------------------------------------------
    // Distance + interchange
    //--------------------------------------------------

    for (const stations of groups.values()) {

        const closestDistance = Math.min(
            ...stations.map(s => s.distance ?? 500)
        );

        // 0–20 points based on proximity
        score += Math.max(
            0,
            25 * (1 - closestDistance / 1000)
        );

        //--------------------------------------------------
        // Count unique train lines
        //--------------------------------------------------

        const lines = new Set<string>();

        for (const station of stations) {

            station.id
                .split("/")
                .map(x => x.trim())
                .forEach(id => lines.add(getTrainLine(id)));

        }

        if (lines.size > 1) {

            // +10 per additional line
            /*
            score += Math.min(
                (lines.size - 1) * 10,
                20
            );*/

            score += Math.min(lines.size * 10, 40);

        }

    }

    //--------------------------------------------------
    // Crowd contribution
    //--------------------------------------------------
/*
    for (const item of mrtCrowd) {

        if (!item?.crowd)
            continue;

        switch (item.crowd.CrowdLevel.toLowerCase()) {

            case "l":
                score += 1;
                break;

            case "m":
                score += 6;
                break;

            case "h":
                score += 12;
                break;

        }

    }*/

        //--------------------------------------------------
// Crowd contribution (per physical station)
//--------------------------------------------------

const crowdByStation = new Map<string, number>();

for (const item of mrtCrowd) {

    if (!item?.crowd)
        continue;

    const key = item.station.name.trim().toUpperCase();

    let crowdScore = 0;

    switch (item.crowd.CrowdLevel.toLowerCase()) {

        case "l":
            crowdScore = 2;
            break;

        case "m":
            crowdScore = 6;
            break;

        case "h":
            crowdScore = 12;
            break;

    }

    // Keep the highest crowd score across all lines
    crowdByStation.set(
        key,
        Math.max(
            crowdByStation.get(key) ?? 0,
            crowdScore
        )
    );

}

for (const value of crowdByStation.values()) {
    score += value;
}


//--------------------------------------------------
// Forecast contribution (low weight)
//--------------------------------------------------

const forecastByStation = new Map<string, number>();

for (const item of mrtForecast) {

    if (!item.forecast.length)
        continue;

    const key = item.station.name.trim().toUpperCase();

    let forecastScore = 0;

    for (const record of item.forecast) {

        switch (record.CrowdLevel.toLowerCase()) {

            case "l":
                forecastScore += 0.25;
                break;

            case "m":
                forecastScore += 0.75;
                break;

            case "h":
                forecastScore += 1.5;
                break;

        }

    }

    forecastScore /= item.forecast.length;

    forecastByStation.set(
        key,
        Math.max(
            forecastByStation.get(key) ?? 0,
            forecastScore
        )
    );

}

for (const value of forecastByStation.values()) {
    score += value;
}

    //--------------------------------------------------

    return Math.round(
        Math.min(100, Math.max(0, score))
    );

}