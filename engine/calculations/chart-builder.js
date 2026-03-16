// Complete Vedic Chart Builder
import { initializeEphemeris, calculateJulianDay, calculatePlanetPosition, calculateHouses, calculateKetu, getAyanamsa } from '../ephemeris/swiss-eph.js';
import { calculateNakshatra, getNakshatraLordAbbrev } from '../constants/nakshatras.js';
import { RASHIS, getRashiIndex, getDegreeInRashi, RASHI_ABBREVS } from '../constants/zodiac.js';
import { VEDIC_PLANETS } from '../constants/swisseph.js';
import { calculateAllVargas } from './vargas/index.js';
import { calculateVimshottariDasha } from './dasha.js';
import { degreesToDMS, formatDMS } from '../utils/formatting.js';
export async function buildChart(birthData, epheData) {
    await initializeEphemeris(epheData);
    const julianDay = calculateJulianDay({
        year: birthData.year, month: birthData.month, day: birthData.day,
        hour: birthData.hour, minute: birthData.minute, second: birthData.second,
        timezoneOffsetHours: birthData.timezoneOffsetHours
    });
    const ayanamsa = getAyanamsa(julianDay);
    const ayanamsaDMS = degreesToDMS(ayanamsa);
    const houseData = calculateHouses(julianDay, birthData.latitude, birthData.longitude, 'E');
    const ascendant = buildPlanetData(-2, 'Ascendant', 'Lagna', 'As', houseData.ascendant, 0, 0, false);
    const planets = [];
    for (const planet of VEDIC_PLANETS) {
        let longitude, latitude, speed, isRetrograde;
        if (planet.id === -1) {
            const rahuPos = calculatePlanetPosition(julianDay, 10);
            longitude = calculateKetu(rahuPos.longitude);
            latitude = -rahuPos.latitude;
            speed = rahuPos.longitudeSpeed;
            isRetrograde = true;
        } else {
            const position = calculatePlanetPosition(julianDay, planet.id);
            longitude = position.longitude;
            latitude = position.latitude;
            speed = position.longitudeSpeed;
            isRetrograde = position.retrograde;
        }
        planets.push(buildPlanetData(planet.id, planet.name, planet.sanskrit, planet.abbrev, longitude, latitude, speed, isRetrograde));
    }
    const moonPlanet = planets.find(p => p.id === 1);
    const dasha = calculateVimshottariDasha(moonPlanet.longitude, birthData.year, birthData.month, birthData.day, birthData.hour, birthData.minute, birthData.second);
    return {
        birthData, julianDay, ayanamsa, ayanamsaFormatted: formatDMS(ayanamsaDMS),
        ascendant, planets, houseCusps: houseData.cusps, mc: houseData.mc, dasha
    };
}
function buildPlanetData(id, name, sanskrit, abbrev, longitude, latitude, speed, isRetrograde) {
    const rashiIndex = getRashiIndex(longitude);
    const degreeInRashi = getDegreeInRashi(longitude);
    const dms = degreesToDMS(degreeInRashi);
    return {
        id, name, sanskrit, abbrev, longitude, latitude,
        rashiIndex, rashiName: RASHIS[rashiIndex].name, rashiAbbrev: RASHI_ABBREVS[rashiIndex],
        degreeInRashi, formattedDegree: formatDMS(dms),
        nakshatra: calculateNakshatra(longitude), isRetrograde, speed,
        vargas: calculateAllVargas(longitude)
    };
}
