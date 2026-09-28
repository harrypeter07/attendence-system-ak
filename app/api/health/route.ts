export async function GET() { return Response.json({ ok: true, service: 'attendly', mode: 'ui-scaffold', timestamp: new Date().toISOString() }) }
