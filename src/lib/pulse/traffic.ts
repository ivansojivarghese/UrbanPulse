export interface NearbyTrafficLink {
    linkId: string;
    roadName: string;
    roadCategory: string;
    speedBand: number;
    minimumSpeed: number;
    maximumSpeed: number;
    distance: number;
}

export function calculateTrafficPulse(
    traffic: NearbyTrafficLink[]
): number {

    if (!traffic.length)
        return 0;

    //-------------------------------------------------------
    // 1. Road density (30)
    //-------------------------------------------------------

    const densityScore =
        Math.min(traffic.length / 120, 1) * 30;

    //-------------------------------------------------------
    // 2. Distance (20)
    //-------------------------------------------------------

    let distanceWeight = 0;

    for (const road of traffic) {

        distanceWeight += Math.max(
            0,
            1 - road.distance / 2000
        );

    }

    const distanceScore =
        Math.min(distanceWeight / 40, 1) * 20;

    //-------------------------------------------------------
    // 3. Traffic congestion (35)
    //-------------------------------------------------------

    let congestionSum = 0;

    for (const road of traffic) {

        let score = 0;

        switch (road.speedBand) {

            case 1: // <10km/h
                score = 1.0;
                break;

            case 2: // 10-19
                score = 0.9;
                break;

            case 3: // 20-29
                score = 0.7;
                break;

            case 4: // 30-39
                score = 0.45;
                break;

            case 5: // 40-49
                score = 0.2;
                break;

            case 6: // >=50
                score = 0.05;
                break;

            default:
                score = 0;
        }

        congestionSum += score;

    }

    const congestionScore =
        (congestionSum / traffic.length) * 35;

    //-------------------------------------------------------
    // 4. Road importance (15)
    //-------------------------------------------------------

    let importanceSum = 0;

    for (const road of traffic) {

        switch (road.roadCategory) {

            case "1":
                importanceSum += 1.0;
                break;

            case "2":
                importanceSum += 0.8;
                break;

            case "3":
                importanceSum += 0.6;
                break;

            case "4":
                importanceSum += 0.4;
                break;

            case "5":
                importanceSum += 0.2;
                break;

            default:
                importanceSum += 0.3;

        }

    }

    const importanceScore =
        (importanceSum / traffic.length) * 15;

    //-------------------------------------------------------

    return Math.round(
        Math.min(
            100,
            densityScore +
            distanceScore +
            congestionScore +
            importanceScore
        )
    );

}