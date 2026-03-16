// Cloudflare Pages Function — POST /api/kundali
// Replaces the Express route from server.mjs
import { buildChart } from '../../engine/calculations/chart-builder.js';
import { initializeEphemeris } from '../../engine/ephemeris/swiss-eph.js';
import { calculatePanchanga } from '../../engine/calculations/panchanga.js';

let ephReady = false;

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  try {
    // Load ephemeris data from static assets on cold start
    if (!ephReady) {
      console.log('[kundali] Loading ephemeris from static assets...');
      const origin = new URL(request.url).origin;
      const [seplRes, semoRes] = await Promise.all([
        env.ASSETS.fetch(new Request(`${origin}/ephe/sepl_18.se1`)),
        env.ASSETS.fetch(new Request(`${origin}/ephe/semo_18.se1`)),
      ]);
      console.log('[kundali] Fetched ephemeris:', seplRes.status, semoRes.status);
      await initializeEphemeris({
        sepl18: new Uint8Array(await seplRes.arrayBuffer()),
        semo18: new Uint8Array(await semoRes.arrayBuffer()),
      });
      console.log('[kundali] Ephemeris initialized.');
      ephReady = true;
    }

    const { year, month, day, hour, minute, lat, lon, tzone } = await request.json();

    const chart = await buildChart({
      year, month, day, hour, minute, second: 0,
      latitude: lat, longitude: lon,
      timezoneOffsetHours: tzone,
    });

    const sunPlanet = chart.planets.find(p => p.id === 0);
    const moonPlanet = chart.planets.find(p => p.id === 1);
    const panchanga = await calculatePanchanga({
      year, month, day, hour, minute, second: 0,
      latitude: lat, longitude: lon,
      timezoneOffsetHours: tzone,
      sunLongitude: sunPlanet?.longitude,
      moonLongitude: moonPlanet?.longitude,
      ayanamsa: chart.ayanamsa,
      ayanamsaFormatted: chart.ayanamsaFormatted,
    });

    const allBodies = [chart.ascendant, ...chart.planets];

    // Build vargas_charts
    const VARGA_KEYS = ['D1','D3','D7','D9','D10','D12','D16','D20','D24','D30','D45','D60','D81'];
    const vargas_charts = {};
    for (const vk of VARGA_KEYS) {
      const ascSignForVk = chart.ascendant.vargas[vk].rashiIndex;
      const chartDict = {};
      for (let i = 0; i < 12; i++) {
        const rashiForHouse = (ascSignForVk + i) % 12;
        const occupants = allBodies
          .filter(p => p.vargas[vk].rashiIndex === rashiForHouse && p.abbrev !== 'As')
          .map(p => p.abbrev);
        chartDict[`H${i + 1}`] = { sign: rashiForHouse + 1, planets: occupants };
      }
      vargas_charts[vk] = chartDict;
    }

    // Build table
    const table = allBodies.map(p => {
      const d = Math.floor(p.degreeInRashi);
      let m = Math.floor((p.degreeInRashi - d) * 60);
      let s = Math.round(((p.degreeInRashi - d) * 60 - m) * 60);
      if (s >= 60) { s = 0; m++; }
      if (m >= 60) { m = 0; }
      return {
        Body: p.abbrev === 'As' ? 'As' : p.abbrev,
        Long: `${d}\u00B0${m}'${s}"`,
        Sign: p.rashiIndex + 1,
        Nakshatra: p.nakshatra.name,
        Pada: p.nakshatra.pada,
        Navamsha: p.vargas.D9.rashiIndex + 1,
      };
    });

    // Build dasha
    const dasha = chart.dasha.mahadashas.map(md => {
      const [y, mo, da] = md.startDate.split('-');
      const [y2, mo2, da2] = md.endDate.split('-');
      return { planet: md.abbrev, start: `${da}-${mo}-${y}`, end: `${da2}-${mo2}-${y2}` };
    });

    // Build panchang
    const pakshaFull = panchanga.tithi?.paksha === 'S' ? 'Shukla Paksha' : 'Krishna Paksha';
    const panchang = {
      vaar: panchanga.vara?.name || '',
      tithi: panchanga.tithi ? `${panchanga.tithi.name} (${pakshaFull})` : '',
      nakshatra: panchanga.nakshatra ? `${panchanga.nakshatra.name} (Pada ${panchanga.nakshatra.pada})` : '',
      yoga: panchanga.yoga?.name || '',
      karana: panchanga.karana?.name || '',
    };

    return new Response(JSON.stringify({ vargas_charts, table, dasha, panchang }), { headers });
  } catch (error) {
    console.error('API Error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message, stack: error.stack }),
      { status: 500, headers }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
