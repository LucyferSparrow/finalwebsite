// Swiss Ephemeris Wrapper for Vedic Astrology
// Uses custom CF-compatible loader (no @deno/shim-deno dependency)
import { Constants, loadFromBytes } from './swisseph-cf.js';

let ephemeris = null;
let ephemerisFilesLoaded = false;

export function resetEphemeris() {
    ephemeris = null;
    ephemerisFilesLoaded = false;
}

/**
 * Initialize the Swiss Ephemeris engine.
 * @param {Object} epheData - Pre-loaded binary data
 * @param {Uint8Array} epheData.sepl18 - sepl_18.se1 contents
 * @param {Uint8Array} epheData.semo18 - semo_18.se1 contents
 */
export async function initializeEphemeris(epheData) {
    if (ephemeris) {
        return ephemeris;
    }
    ephemeris = await loadFromBytes();
    ephemeris.mount('sepl_18.se1', epheData.sepl18);
    ephemeris.mount('semo_18.se1', epheData.semo18);
    ephemeris.set_ephe_path('.');
    ephemerisFilesLoaded = true;
    ephemeris.swe_set_sid_mode(27, 0, 0); // SE_SIDM_TRUE_CITRA
    return ephemeris;
}
export function getEphemeris() {
    if (!ephemeris) {
        throw new Error('Ephemeris not initialized. Call initializeEphemeris() first.');
    }
    return ephemeris;
}
function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}
export function calculateJulianDay(input) {
    const eph = getEphemeris();
    const localDecimalHours = input.hour + (input.minute / 60) + (input.second / 3600);
    let utDecimalHours = localDecimalHours - input.timezoneOffsetHours;
    let utDay = input.day;
    let utMonth = input.month;
    let utYear = input.year;
    if (utDecimalHours < 0) {
        utDecimalHours += 24;
        utDay -= 1;
        if (utDay < 1) {
            utMonth -= 1;
            if (utMonth < 1) { utMonth = 12; utYear -= 1; }
            utDay = daysInMonth(utYear, utMonth);
        }
    }
    else if (utDecimalHours >= 24) {
        utDecimalHours -= 24;
        utDay += 1;
        if (utDay > daysInMonth(utYear, utMonth)) {
            utDay = 1; utMonth += 1;
            if (utMonth > 12) { utMonth = 1; utYear += 1; }
        }
    }
    return eph.swe_julday(utYear, utMonth, utDay, utDecimalHours, Constants.SE_GREG_CAL);
}
export function getAyanamsa(julianDay) {
    const eph = getEphemeris();
    return eph.swe_get_ayanamsa_ut(julianDay);
}
export function calculatePlanetPosition(julianDay, planetId) {
    const eph = getEphemeris();
    const flags = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;
    const result = eph.swe_calc_ut(julianDay, planetId, flags);
    if (result.error && result.error.includes('ERR') && !result.error.includes('Moshier')) {
        throw new Error(`Ephemeris calculation error: ${result.error}`);
    }
    return {
        longitude: result.xx[0],
        latitude: result.xx[1],
        distance: result.xx[2],
        longitudeSpeed: result.xx[3],
        retrograde: result.xx[3] < 0
    };
}
export function calculateKetu(rahuLongitude) {
    let ketuLongitude = rahuLongitude + 180;
    if (ketuLongitude >= 360) ketuLongitude -= 360;
    return ketuLongitude;
}
export function calculateHouses(julianDay, latitude, longitude, houseSystem = 'E') {
    const eph = getEphemeris();
    try {
        const result = eph.swe_houses_ex(julianDay, Constants.SEFLG_SIDEREAL, latitude, longitude, houseSystem.charCodeAt(0));
        const siderealCusps = [];
        for (let i = 1; i <= 12; i++) { siderealCusps.push(result.cusps[i]); }
        return { ascendant: result.ascmc[0], mc: result.ascmc[1], cusps: siderealCusps };
    }
    catch {
        const result = eph.swe_houses(julianDay, latitude, longitude, houseSystem.charCodeAt(0));
        const ayanamsa = getAyanamsa(julianDay);
        let siderealAsc = result.ascmc[0] - ayanamsa;
        if (siderealAsc < 0) siderealAsc += 360;
        let siderealMC = result.ascmc[1] - ayanamsa;
        if (siderealMC < 0) siderealMC += 360;
        const siderealCusps = [];
        for (let i = 1; i <= 12; i++) {
            let sidereal = result.cusps[i] - ayanamsa;
            if (sidereal < 0) sidereal += 360;
            siderealCusps.push(sidereal);
        }
        return { ascendant: siderealAsc, mc: siderealMC, cusps: siderealCusps };
    }
}
export { Constants };
