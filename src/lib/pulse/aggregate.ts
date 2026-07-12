export function calculateAggregatePulse(
    busPulse: number,
    mrtPulse: number,
    taxiPulse: number,
    parkingPulse: number,
    trafficPulse: number
): number {
    return Math.round(
        busPulse * 0.4 +
        mrtPulse * 0.25 + 
        taxiPulse * 0.1 +
        parkingPulse * 0.15 +
        trafficPulse * 0.1
    );
}