interface TaxiResult {
    count: number;
    radius: number;
    areaSqKm: number;
    density: number;
}

export function calculateTaxiPulse(
    taxi: TaxiResult
): number {

    let score = 0;

    //--------------------------------------------------
    // 1. Taxi density (0–60)
    //--------------------------------------------------

    // Typical SG density:
    // ~0.2 = sparse
    // ~0.5 = moderate
    // ~1.0+ = very high

    const densityScore =
        Math.min(
            taxi.density / 1.0,
            1
        ) * 60;

    score += densityScore;

    //--------------------------------------------------
    // 2. Taxi count (0–25)
    //--------------------------------------------------

    const countScore =
        Math.min(
            taxi.count / 20,
            1
        ) * 25;

    score += countScore;

    //--------------------------------------------------
    // 3. Coverage bonus (0–15)
    //--------------------------------------------------

    if (taxi.count >= 30)
        score += 15;

    else if (taxi.count >= 20)
        score += 12;

    else if (taxi.count >= 15)
        score += 9;

    else if (taxi.count >= 10)
        score += 6;

    else if (taxi.count >= 5)
        score += 3;

    //--------------------------------------------------

    return Math.round(
        Math.min(100, Math.max(0, score))
    );

}