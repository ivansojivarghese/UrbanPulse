
/*

interface NearbyStop {
    bus_stop_code: string;
    distance: number;
}

interface BusArrivalResult {
    busStopCode: string;
    services: {
        serviceNo: string;
        operator: string;
        nextBus: Bus;
        nextBus2: Bus;
        nextBus3: Bus;
    }[];
}

interface Bus {
    minutes: number | null;
    Load: "SEA" | "SDA" | "LSD";
    Type: "SD" | "DD" | "BD";
}

export function calculateBusPulse(
    nearbyStops: NearbyStop[],
    busArrivals: BusArrivalResult[]
): number {

    //-------------------------------------------------------
    // 1. Bus stop density (20)
    //-------------------------------------------------------

    const stopScore =
        Math.min(
            nearbyStops.length / 6,
            1
        ) * 20;

    //-------------------------------------------------------
    // 2–5. Bus arrivals
    //-------------------------------------------------------

    let arrivalScore = 0;
    let busCountScore = 0;
    let occupancyScore = 0;
    let vehicleScore = 0;

    let occupancyWeightSum = 0;
    let vehicleWeightSum = 0;

    let arrivingSoon = 0;

    for (const stop of busArrivals) {

        for (const service of stop.services) {

            for (const bus of [

                service.nextBus,

                service.nextBus2,

                service.nextBus3

            ]) {

                if (bus.minutes == null)
                    continue;

                //------------------------------------------
                // ETA score
                //------------------------------------------

                let etaWeight = 0;

                if (bus.minutes <= 2)
                    etaWeight = 1.0;

                else if (bus.minutes <= 5)
                    etaWeight = 0.9;

                else if (bus.minutes <= 10)
                    etaWeight = 0.7;

                else if (bus.minutes <= 15)
                    etaWeight = 0.4;

                else
                    etaWeight = 0.1;

                arrivalScore += etaWeight;

                //------------------------------------------
                // buses within 15 mins
                //------------------------------------------

                if (bus.minutes <= 15)
                    arrivingSoon++;

                //------------------------------------------
                // occupancy
                //------------------------------------------

                switch (bus.Load) {

                    case "SEA":
                        occupancyWeightSum += 1;
                        break;

                    case "SDA":
                        occupancyWeightSum += 2;
                        break;

                    case "LSD":
                        occupancyWeightSum += 3;
                        break;
                }

                //------------------------------------------
                // vehicle size
                //------------------------------------------

                switch (bus.Type) {

                    case "SD":
                        vehicleWeightSum += 1;
                        break;

                    case "BD":
                        vehicleWeightSum += 1.4;
                        break;

                    case "DD":
                        vehicleWeightSum += 1.5;
                        break;
                }

            }

        }

    }

    //-------------------------------------------------------
    // Frequency score (30)
    //-------------------------------------------------------

    arrivalScore =
        Math.min(arrivalScore / 20, 1) * 30;

    //-------------------------------------------------------
    // Bus count score (20)
    //-------------------------------------------------------

    busCountScore =
        Math.min(arrivingSoon / 10, 1) * 20;

    //-------------------------------------------------------
    // Occupancy score (20)
    //-------------------------------------------------------

    if (occupancyWeightSum > 0) {

        const avg =
            occupancyWeightSum /
            Math.max(arrivingSoon, 1);

        occupancyScore =
            ((avg - 1) / 2) * 20;
    }

    //-------------------------------------------------------
    // Vehicle size score (10)
    //-------------------------------------------------------

    if (vehicleWeightSum > 0) {

        const avg =
            vehicleWeightSum /
            Math.max(arrivingSoon, 1);

        vehicleScore =
            ((avg - 1) / 0.5) * 10;
    }

    //-------------------------------------------------------
    // Final
    //-------------------------------------------------------

    const pulse =

        stopScore +

        arrivalScore +

        busCountScore +

        occupancyScore +

        vehicleScore;

    return Math.round(

        Math.min(
            100,
            pulse
        )

    );

}

*/


interface NearbyStop {
    bus_stop_code: string;
    distance: number;
}

interface BusArrivalResult {
    busStopCode: string;
    services: {
        serviceNo: string;
        operator: string;
        nextBus: Bus;
        nextBus2: Bus;
        nextBus3: Bus;
    }[];
}

interface Bus {
    minutes: number | null;
    Load: "SEA" | "SDA" | "LSD";
    Type: "SD" | "DD" | "BD";
}

export function calculateBusPulse(
    nearbyStops: NearbyStop[],
    busArrivals: BusArrivalResult[]
): number {

    let score = 0;

    //-------------------------------------------------------
    // 1. Stop density (15)
    //-------------------------------------------------------

    score += Math.min(
        nearbyStops.length / 6,
        1
    ) * 15;

    //-------------------------------------------------------
    // 2. Distance score (15)
    //-------------------------------------------------------

    if (nearbyStops.length > 0) {

        const closest = Math.min(
            ...nearbyStops.map(stop => stop.distance)
        );

        score += Math.max(
            0,
            15 * (1 - closest / 250)
        );

    }

    //-------------------------------------------------------
    // Track metrics
    //-------------------------------------------------------

    let etaWeightSum = 0;

    let busesWithin15 = 0;

    let occupancyWeightSum = 0;

    let vehicleWeightSum = 0;

    let countedBuses = 0;

    const uniqueServices = new Set<string>();

    //-------------------------------------------------------
    // Analyse arrivals
    //-------------------------------------------------------

    for (const stop of busArrivals) {

        for (const service of stop.services) {

            uniqueServices.add(service.serviceNo);

            for (const bus of [

                service.nextBus,
                service.nextBus2,
                service.nextBus3

            ]) {

                if (bus.minutes == null)
                    continue;

                countedBuses++;

                //------------------------------------------
                // ETA
                //------------------------------------------

                let etaWeight = 0;

                if (bus.minutes <= 2)
                    etaWeight = 1.0;

                else if (bus.minutes <= 5)
                    etaWeight = 0.9;

                else if (bus.minutes <= 10)
                    etaWeight = 0.7;

                else if (bus.minutes <= 15)
                    etaWeight = 0.4;

                else
                    etaWeight = 0.1;

                etaWeightSum += etaWeight;

                if (bus.minutes <= 15)
                    busesWithin15++;

                //------------------------------------------
                // Occupancy
                //------------------------------------------

                switch (bus.Load) {

                    case "SEA":
                        occupancyWeightSum += 1;
                        break;

                    case "SDA":
                        occupancyWeightSum += 2;
                        break;

                    case "LSD":
                        occupancyWeightSum += 3;
                        break;

                }

                //------------------------------------------
                // Vehicle type
                //------------------------------------------

                switch (bus.Type) {

                    case "SD":
                        vehicleWeightSum += 1;
                        break;

                    case "BD":
                        vehicleWeightSum += 1.25;
                        break;

                    case "DD":
                        vehicleWeightSum += 1.4;
                        break;

                }

            }

        }

    }

    //-------------------------------------------------------
    // 3. ETA score (25)
    //-------------------------------------------------------

    score += Math.min(
        etaWeightSum / 20,
        1
    ) * 25;

    //-------------------------------------------------------
    // 4. Bus frequency (15)
    //-------------------------------------------------------

    score += Math.min(
        busesWithin15 / 8,
        1
    ) * 15;

    //-------------------------------------------------------
    // 5. Occupancy (20)
    //-------------------------------------------------------

    if (countedBuses > 0) {

        const avgLoad =
            occupancyWeightSum /
            countedBuses;

        score +=
            ((avgLoad - 1) / 2) * 20;

    }

    //-------------------------------------------------------
    // 6. Vehicle capacity (5)
    //-------------------------------------------------------

    if (countedBuses > 0) {

        const avgVehicle =
            vehicleWeightSum /
            countedBuses;

        score +=
            ((avgVehicle - 1) / 0.4) * 5;

    }

    //-------------------------------------------------------
    // 7. Route diversity (5)
    //-------------------------------------------------------

    score += Math.min(
        uniqueServices.size / 20,
        1
    ) * 5;

    //-------------------------------------------------------

    return Math.round(
        Math.max(
            0,
            Math.min(score, 100)
        )
    );

}