// Vimshottari Dasha System
import { NAKSHATRAS, NAKSHATRA_SPAN } from '../constants/nakshatras.js';
const DASHA_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_ABBREVS = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Jp', 'Sa', 'Me'];
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
const DAYS_PER_YEAR = 365.25;
const MS_PER_DAY = 86400000;
export function calculateVimshottariDasha(moonLongitude, birthYear, birthMonth, birthDay, birthHour, birthMinute, birthSecond) {
    let moonLong = moonLongitude % 360;
    if (moonLong < 0) moonLong += 360;
    const nakshatraIndex = Math.floor(moonLong / NAKSHATRA_SPAN);
    const posInNakshatra = moonLong - nakshatraIndex * NAKSHATRA_SPAN;
    const fractionTraversed = posInNakshatra / NAKSHATRA_SPAN;
    const dashaLordIndex = nakshatraIndex % 9;
    const balanceFraction = 1 - fractionTraversed;
    const balanceYears = balanceFraction * DASHA_YEARS[dashaLordIndex];
    const balanceDays = balanceYears * DAYS_PER_YEAR;
    const fullDashaDays = DASHA_YEARS[dashaLordIndex] * DAYS_PER_YEAR;
    const elapsedDays = fullDashaDays - balanceDays;
    const birthMs = Date.UTC(birthYear, birthMonth - 1, birthDay, birthHour, birthMinute, birthSecond);
    const firstDashaStartMs = birthMs - elapsedDays * MS_PER_DAY;
    const mahadashas = [];
    let currentMs = firstDashaStartMs;
    let lordIdx = dashaLordIndex;
    for (let i = 0; i < 9; i++) {
        const days = DASHA_YEARS[lordIdx] * DAYS_PER_YEAR;
        const endMs = currentMs + days * MS_PER_DAY;
        const ageAtStart = (currentMs - birthMs) / (DAYS_PER_YEAR * MS_PER_DAY);
        mahadashas.push({
            lord: DASHA_LORDS[lordIdx], abbrev: DASHA_ABBREVS[lordIdx],
            years: DASHA_YEARS[lordIdx], startDate: msToDateStr(currentMs),
            endDate: msToDateStr(endMs), startAge: Math.round(ageAtStart * 10) / 10
        });
        currentMs = endMs;
        lordIdx = (lordIdx + 1) % 9;
    }
    return {
        startingNakshatra: NAKSHATRAS[nakshatraIndex].name,
        nakshatraLord: DASHA_LORDS[dashaLordIndex],
        nakshatraLordAbbrev: DASHA_ABBREVS[dashaLordIndex],
        moonLongitude: moonLong,
        balanceAtBirth: Math.round(balanceYears * 100) / 100,
        mahadashas
    };
}
function msToDateStr(ms) {
    const d = new Date(ms);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
