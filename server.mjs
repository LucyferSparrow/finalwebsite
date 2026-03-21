// Jyotish Veda — Standalone Kundali Server (local dev only)
// For production, use Cloudflare Pages: npm run dev / npm run deploy

import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildChart } from './engine/calculations/chart-builder.js';
import { initializeEphemeris } from './engine/ephemeris/swiss-eph.js';
import { calculatePanchanga } from './engine/calculations/panchanga.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve the kundali UI files from this directory
app.use(express.static(__dirname));

// Root serves kundali.html
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'kundali.html'));
});

// Kundali API endpoint
app.post('/api/kundali', async (req, res, next) => {
  try {
    const { year, month, day, hour, minute, lat, lon, tzone } = req.body;

    const chart = await buildChart({
      year, month, day, hour, minute, second: 0,
      latitude: lat, longitude: lon,
      timezoneOffsetHours: tzone
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

    // Build vargas_charts: { D1: { H1: {sign:1-12, planets:["Su",...] }, ... }, ... }
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
        Long: `${d}°${m}'${s}"`,
        Sign: p.rashiIndex + 1,
        Nakshatra: p.nakshatra.name,
        Pada: p.nakshatra.pada,
        Navamsha: p.vargas.D9.rashiIndex + 1
      };
    });

    // Build dasha
    const dasha = chart.dasha.mahadashas.map(md => {
      const [y, mo, da] = md.startDate.split('-');
      const [y2, mo2, da2] = md.endDate.split('-');
      return {
        planet: md.abbrev,
        start: `${da}-${mo}-${y}`,
        end: `${da2}-${mo2}-${y2}`
      };
    });
    const dashaMeta = {
      startingTara: chart.dasha.nakshatraLordAbbrev,
      startingNakshatra: chart.dasha.startingNakshatra
    };

    // Build panchang
    const pakshaFull = panchanga.tithi?.paksha === 'S' ? 'Shukla Paksha' : 'Krishna Paksha';
    const panchang = {
      vaar: panchanga.vara?.name || '',
      tithi: panchanga.tithi ? `${panchanga.tithi.name} (${pakshaFull})` : '',
      nakshatra: panchanga.nakshatra ? `${panchanga.nakshatra.name} (Pada ${panchanga.nakshatra.pada})` : '',
      yoga: panchanga.yoga?.name || '',
      karana: panchanga.karana?.name || ''
    };

    res.json({ vargas_charts, table, dasha, dashaMeta, panchang });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start
async function start() {
  console.log('Initializing Swiss Ephemeris (True Chitrapaksha)...');
  const epheDir = join(__dirname, 'ephe');
  const [sepl18, semo18] = await Promise.all([
    readFile(join(epheDir, 'sepl_18.se1')),
    readFile(join(epheDir, 'semo_18.se1')),
  ]);
  await initializeEphemeris({
    sepl18: new Uint8Array(sepl18),
    semo18: new Uint8Array(semo18),
  });
  console.log('Engine ready.');
  app.listen(PORT, () => {
    console.log(`Jyotish Veda running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);
