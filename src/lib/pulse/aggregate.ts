export function calculateAggregatePulse(
    busPulse: number,
    mrtPulse: number,
    taxiPulse: number,
    parkingPulse: number
): number {
    return Math.round(
        busPulse * 0.45 +
        mrtPulse * 0.3 + 
        taxiPulse * 0.1 +
        parkingPulse * 0.15
    );
}