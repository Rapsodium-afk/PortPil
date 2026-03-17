import { NextResponse } from 'next/server';
import { takeOccupancySnapshot } from '@/lib/traceability';

export async function POST(request: Request) {
  // En producción, aquí verificaríamos un API Key o una cabecera de secreto
  // para asegurar que solo el CRON job puede ejecutarlo.
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await takeOccupancySnapshot();
    return NextResponse.json({ success: true, message: 'Snapshot taken successfully' });
  } catch (error) {
    console.error('Snapshot API Error:', error);
    return NextResponse.json({ error: 'Failed to take snapshot' }, { status: 500 });
  }
}
