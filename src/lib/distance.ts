export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371000;

    const toRad = (d: number) => d * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}

export function pointToSegmentDistance(
    lat: number,
    lng: number,
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
): number {

    // Approximate Earth locally as a plane
    const metersPerDegLat = 111320;

    const metersPerDegLng =
        111320 * Math.cos(
            ((startLat + endLat) / 2) * Math.PI / 180
        );

    const px = lng * metersPerDegLng;
    const py = lat * metersPerDegLat;

    const ax = startLng * metersPerDegLng;
    const ay = startLat * metersPerDegLat;

    const bx = endLng * metersPerDegLng;
    const by = endLat * metersPerDegLat;

    const abx = bx - ax;
    const aby = by - ay;

    const apx = px - ax;
    const apy = py - ay;

    const abLengthSq =
        abx * abx + aby * aby;

    if (abLengthSq === 0) {

        return Math.sqrt(
            apx * apx + apy * apy
        );

    }

    let t =
        (apx * abx + apy * aby) /
        abLengthSq;

    t = Math.max(
        0,
        Math.min(1, t)
    );

    const closestX =
        ax + t * abx;

    const closestY =
        ay + t * aby;

    return Math.sqrt(

        (px - closestX) *
        (px - closestX) +

        (py - closestY) *
        (py - closestY)

    );

}