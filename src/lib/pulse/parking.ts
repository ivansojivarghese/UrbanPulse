
export interface NearbyCarpark {
    id: string;
    development: string;
    distance: number;
    availableLots: number;
    totalLots: number | null;
}

export function calculateParkingPulse(
    carparks: NearbyCarpark[]
): number {

    console.log(carparks);

    if (!carparks.length && carparks)
        return 0;

    //-------------------------------------------------------
    // Density (20)
    //-------------------------------------------------------

    const densityScore =
        Math.min(carparks.length / 8, 1) * 20;

    //-------------------------------------------------------
    // Distance (20)
    //-------------------------------------------------------

    let distanceScore = 0;

    for (const cp of carparks) {

        distanceScore +=
            Math.max(
                0,
                1 - cp.distance / 500
            );

    }

    distanceScore =
        Math.min(distanceScore / 5, 1) * 20;

    //-------------------------------------------------------
    // Occupancy (50)
    //-------------------------------------------------------

    let weightedOccupancy = 0;
    let totalWeight = 0;

    for (const cp of carparks) {

        if (
            cp.totalLots == null ||
            cp.totalLots <= 0
        )
            continue;

        const occupied =
            cp.totalLots - cp.availableLots;

        const occupancy =
            occupied / cp.totalLots;

        // Larger carparks influence more
        const weight =
            Math.sqrt(cp.totalLots);

        weightedOccupancy +=
            occupancy * weight;

        totalWeight += weight;

    }

    let occupancyScore = 0;

    if (totalWeight > 0) {

        const avgOccupancy =
            weightedOccupancy / totalWeight;

        occupancyScore =
            avgOccupancy * 50;

    }

    //-------------------------------------------------------
    // Capacity score (10)
    //-------------------------------------------------------

    const totalCapacity =
        carparks.reduce(

            (sum, cp) =>

                sum + (cp.totalLots ?? 0),

            0

        );

    const capacityScore =
        Math.min(
            totalCapacity / 3000,
            1
        ) * 10;

    //-------------------------------------------------------

    return Math.round(

        Math.min(

            100,

            densityScore +
            distanceScore +
            occupancyScore +
            capacityScore

        )

    );

}