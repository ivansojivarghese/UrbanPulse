export function calculateAggregatePulse(
    busPulse: number,
    mrtPulse: number,
    taxiPulse: number
): number {
    return Math.round(
        busPulse * 0.55 +
        mrtPulse * 0.3 + 
        taxiPulse * 0.15
    );
}