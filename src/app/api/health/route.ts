import {loadDashboardState} from '@/lib/fpbpack';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await loadDashboardState();
  const ready = Boolean(state.inventory && state.report);

  return Response.json(
    {
      status: ready ? 'healthy' : 'degraded',
      inventory: Boolean(state.inventory),
      report: Boolean(state.report),
      errors: state.errors,
    },
    {status: ready ? 200 : 503},
  );
}
