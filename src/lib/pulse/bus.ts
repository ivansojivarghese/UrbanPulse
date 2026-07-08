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