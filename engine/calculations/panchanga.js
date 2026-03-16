// Panchanga (Vedic Almanac) Calculations
import { initializeEphemeris, calculateJulianDay, calculatePlanetPosition, getAyanamsa } from '../ephemeris/swiss-eph.js';
import { calculateNakshatra, NAKSHATRA_SPAN, getNakshatraLordAbbrev } from '../constants/nakshatras.js';
import { degreesToDMS, formatDMS } from '../utils/formatting.js';
const SE_SUN = 0;
const SE_MOON = 1;
const DEG = Math.PI / 180;
const VARA_DATA = [
    { name: 'Sunday', abbrev: 'Su', lordAbbrev: 'Su' },
    { name: 'Monday', abbrev: 'Mo', lordAbbrev: 'Mo' },
    { name: 'Tuesday', abbrev: 'Ma', lordAbbrev: 'Ma' },
    { name: 'Wednesday', abbrev: 'Me', lordAbbrev: 'Me' },
    { name: 'Thursday', abbrev: 'Jp', lordAbbrev: 'Jp' },
    { name: 'Friday', abbrev: 'Ve', lordAbbrev: 'Ve' },
    { name: 'Saturday', abbrev: 'Sa', lordAbbrev: 'Sa' },
];
const TITHI_NAMES_S = [
    'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
];
const TITHI_NAMES_K = [
    'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];
const MOVABLE_KARANAS = [
    { name: 'Bava', lordAbbrev: 'Su' }, { name: 'Balava', lordAbbrev: 'Mo' },
    { name: 'Kaulava', lordAbbrev: 'Ma' }, { name: 'Taitila', lordAbbrev: 'Me' },
    { name: 'Gara', lordAbbrev: 'Jp' }, { name: 'Vanija', lordAbbrev: 'Ve' },
    { name: 'Vishti', lordAbbrev: 'Sa' },
];
const YOGA_DATA = [
    { name: 'Vishkambha', lordAbbrev: 'Sa' }, { name: 'Preeti', lordAbbrev: 'Me' },
    { name: 'Ayushman', lordAbbrev: 'Ke' }, { name: 'Saubhagya', lordAbbrev: 'Ve' },
    { name: 'Shobhana', lordAbbrev: 'Su' }, { name: 'Atiganda', lordAbbrev: 'Mo' },
    { name: 'Sukarma', lordAbbrev: 'Ma' }, { name: 'Dhriti', lordAbbrev: 'Ra' },
    { name: 'Shula', lordAbbrev: 'Jp' }, { name: 'Ganda', lordAbbrev: 'Sa' },
    { name: 'Vriddhi', lordAbbrev: 'Me' }, { name: 'Dhruva', lordAbbrev: 'Ke' },
    { name: 'Vyaghata', lordAbbrev: 'Ve' }, { name: 'Harshana', lordAbbrev: 'Su' },
    { name: 'Vajra', lordAbbrev: 'Mo' }, { name: 'Siddhi', lordAbbrev: 'Ma' },
    { name: 'Vyatipata', lordAbbrev: 'Ra' }, { name: 'Variyan', lordAbbrev: 'Jp' },
    { name: 'Parigha', lordAbbrev: 'Sa' }, { name: 'Shiva', lordAbbrev: 'Me' },
    { name: 'Siddha', lordAbbrev: 'Ke' }, { name: 'Sadhya', lordAbbrev: 'Ve' },
    { name: 'Shubha', lordAbbrev: 'Su' }, { name: 'Shukla', lordAbbrev: 'Mo' },
    { name: 'Brahma', lordAbbrev: 'Ma' }, { name: 'Indra', lordAbbrev: 'Ra' },
    { name: 'Vaidhriti', lordAbbrev: 'Jp' },
];
const CHALDEAN = ['Sa', 'Jp', 'Ma', 'Su', 'Ve', 'Me', 'Mo'];
const WEEKDAY_CHALDEAN_START = [3, 6, 2, 5, 1, 4, 0];
function calcJDNoon(y, m, d) {
    if (m <= 2) { y--; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + 0.5;
}
function fmtHours(h) {
    h = ((h % 24) + 24) % 24;
    const hh = Math.floor(h);
    const mf = (h - hh) * 60;
    const mm = Math.floor(mf);
    const ss = Math.round((mf - mm) * 60);
    const ssC = ss >= 60 ? 59 : ss;
    const mmC = mm >= 60 ? 59 : mm;
    return `${pad(hh)}:${pad(mmC)}:${pad(ssC)}`;
}
function pad(n) { return String(n).padStart(2, '0'); }
export function calcSunriseSunset(year, month, day, lat, lon, tz) {
    const JD = calcJDNoon(year, month, day);
    const n = JD - 2451545.0;
    const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
    const g = (((357.528 + 0.9856003 * n) % 360 + 360) % 360) * DEG;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
    const eps = 23.439 * DEG;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const Lr = L * DEG;
    const EqT = -1.915 * Math.sin(g) - 0.020 * Math.sin(2 * g)
        + 2.466 * Math.sin(2 * Lr) - 0.053 * Math.sin(4 * Lr);
    const solarNoon = 12 - lon / 15 - EqT / 15 + tz;
    const latR = lat * DEG;
    const cosH = (Math.sin(-0.833 * DEG) - Math.sin(latR) * Math.sin(dec))
        / (Math.cos(latR) * Math.cos(dec));
    if (Math.abs(cosH) > 1) {
        return { sunrise: '--:--:--', sunset: '--:--:--', sunriseH: 6, sunsetH: 18 };
    }
    const H = Math.acos(cosH) / DEG / 15;
    const sunriseH = solarNoon - H;
    const sunsetH = solarNoon + H;
    return { sunrise: fmtHours(sunriseH), sunset: fmtHours(sunsetH), sunriseH, sunsetH };
}
function jdWeekday(jd) { return Math.floor(jd + 1.5) % 7; }
function norm360(a) { return ((a % 360) + 360) % 360; }
export async function calculatePanchanga(input) {
    await initializeEphemeris();
    const jd = calculateJulianDay({
        year: input.year, month: input.month, day: input.day,
        hour: input.hour, minute: input.minute, second: input.second,
        timezoneOffsetHours: input.timezoneOffsetHours,
    });
    const ayanamsa = input.ayanamsa ?? getAyanamsa(jd);
    const ayanamsaFormatted = input.ayanamsaFormatted ?? formatDMS(degreesToDMS(ayanamsa));
    let sunLong = input.sunLongitude;
    let moonLong = input.moonLongitude;
    if (sunLong === undefined) { sunLong = calculatePlanetPosition(jd, SE_SUN).longitude; }
    if (moonLong === undefined) { moonLong = calculatePlanetPosition(jd, SE_MOON).longitude; }
    sunLong = norm360(sunLong);
    moonLong = norm360(moonLong);
    const { sunrise, sunset, sunriseH } = calcSunriseSunset(input.year, input.month, input.day, input.latitude, input.longitude, input.timezoneOffsetHours);
    const jdNoon = calcJDNoon(input.year, input.month, input.day);
    const varaIndex = jdWeekday(jdNoon);
    const vara = VARA_DATA[varaIndex];
    const elongation = norm360(moonLong - sunLong);
    const tithiFloat = elongation / 12;
    const tithiIndex = Math.floor(tithiFloat);
    const tithiPctLeft = (1 - (tithiFloat % 1)) * 100;
    const isKrishna = tithiIndex >= 15;
    const tithiInPaksha = isKrishna ? tithiIndex - 14 : tithiIndex + 1;
    const tithiName = isKrishna ? TITHI_NAMES_K[tithiIndex - 15] : TITHI_NAMES_S[tithiIndex];
    const tithiLordAbbrev = VARA_DATA[tithiIndex % 7].lordAbbrev;
    const nak = calculateNakshatra(moonLong);
    const posInNak = moonLong % NAKSHATRA_SPAN;
    const nakPctLeft = (1 - posInNak / NAKSHATRA_SPAN) * 100;
    const karanaFloat = elongation / 6;
    const karanaIndex = Math.floor(karanaFloat) % 60;
    const karanaPctLeft = (1 - (karanaFloat % 1)) * 100;
    let karanaName, karanaLordAbbrev;
    if (karanaIndex === 0) { karanaName = 'Kimstughna'; karanaLordAbbrev = 'Su'; }
    else if (karanaIndex >= 57) {
        const fixed = [
            { name: 'Shakuni', lordAbbrev: 'Ra' }, { name: 'Chatushpada', lordAbbrev: 'Ke' },
            { name: 'Naga', lordAbbrev: 'Sa' },
        ][karanaIndex - 57];
        karanaName = fixed.name; karanaLordAbbrev = fixed.lordAbbrev;
    } else {
        const mv = MOVABLE_KARANAS[(karanaIndex - 1) % 7];
        karanaName = mv.name; karanaLordAbbrev = mv.lordAbbrev;
    }
    const yogaSum = norm360(moonLong + sunLong);
    const yogaFloat = yogaSum / NAKSHATRA_SPAN;
    const yogaIndex = Math.floor(yogaFloat) % 27;
    const yogaPctLeft = (1 - (yogaFloat % 1)) * 100;
    const yoga = YOGA_DATA[yogaIndex];
    const localHour = input.hour + input.minute / 60 + input.second / 3600;
    const hoursSinceSunrise = localHour - sunriseH;
    const horaNumber = Math.floor(hoursSinceSunrise);
    const horaFracUsed = hoursSinceSunrise - horaNumber;
    const horaChaldeanStart = WEEKDAY_CHALDEAN_START[varaIndex];
    const horaChaldeanIndex = ((horaChaldeanStart + horaNumber) % 7 + 7) % 7;
    const hora = { lordAbbrev: CHALDEAN[horaChaldeanIndex], percentLeft: (1 - horaFracUsed) * 100 };
    const KALA_MINS = 48;
    const minsSinceSunrise = hoursSinceSunrise * 60;
    const kalaNumber = Math.floor(minsSinceSunrise / KALA_MINS);
    const kalaFracUsed = (minsSinceSunrise % KALA_MINS) / KALA_MINS;
    const kalaChaldeanIndex = ((horaChaldeanStart + kalaNumber) % 7 + 7) % 7;
    const kala = { lordAbbrev: CHALDEAN[kalaChaldeanIndex], percentLeft: (1 - kalaFracUsed) * 100 };
    const birthTime = `${input.year}-${pad(input.month)}-${pad(input.day)}T${pad(input.hour)}:${pad(input.minute)}:${pad(input.second)}`;
    return {
        birthTime, sunrise, sunset,
        vara: { name: vara.name, abbrev: vara.abbrev, lordAbbrev: vara.lordAbbrev },
        tithi: { number: tithiIndex + 1, name: tithiName, paksha: isKrishna ? 'K' : 'S', lordAbbrev: tithiLordAbbrev, percentLeft: tithiPctLeft, tithiInPaksha },
        nakshatra: { name: nak.name, number: nak.number, lordAbbrev: getNakshatraLordAbbrev(nak.lord), percentLeft: nakPctLeft, pada: nak.pada },
        karana: { name: karanaName, lordAbbrev: karanaLordAbbrev, percentLeft: karanaPctLeft },
        yoga: { name: yoga.name, lordAbbrev: yoga.lordAbbrev, percentLeft: yogaPctLeft },
        hora, kala, ayanamsa: ayanamsaFormatted,
        coordinates: [input.latitude, input.longitude], timezone: input.timezoneOffsetHours,
    };
}
