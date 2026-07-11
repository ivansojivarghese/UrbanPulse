export function calculateAggregatePulse(
    busPulse: number,
    mrtPulse: number
): number {
    return Math.round(
        busPulse * 0.65 +
        mrtPulse * 0.35
    );
}