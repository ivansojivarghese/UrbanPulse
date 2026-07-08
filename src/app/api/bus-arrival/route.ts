import { NextRequest, NextResponse } from 'next/server';
import { getBusArrival } from '@/lib/busArrival';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const busStopCode = searchParams.get('busStopCode');

  if (!busStopCode) {
    return NextResponse.json({ error: 'Missing busStopCode' }, { status: 400 });
  }

  try {
    const busArrival = await getBusArrival(busStopCode);

    return NextResponse.json(busArrival);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load bus arrival';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}