// Nakshatra (Lunar Mansions) Constants for Vedic Astrology
export const NAKSHATRA_SPAN = 360 / 27;
export const PADA_SPAN = NAKSHATRA_SPAN / 4;
export const NAKSHATRAS = [
    { index: 0, number: 1, name: 'Ashwini', sanskrit: 'Ashvini', lord: 'Ketu', deity: 'Ashwini Kumaras', startDeg: 0 },
    { index: 1, number: 2, name: 'Bharani', sanskrit: 'Bharani', lord: 'Venus', deity: 'Yama', startDeg: 13.333333 },
    { index: 2, number: 3, name: 'Krittika', sanskrit: 'Krittika', lord: 'Sun', deity: 'Agni', startDeg: 26.666667 },
    { index: 3, number: 4, name: 'Rohini', sanskrit: 'Rohini', lord: 'Moon', deity: 'Brahma', startDeg: 40 },
    { index: 4, number: 5, name: 'Mrigashira', sanskrit: 'Mrigashira', lord: 'Mars', deity: 'Soma', startDeg: 53.333333 },
    { index: 5, number: 6, name: 'Ardra', sanskrit: 'Ardra', lord: 'Rahu', deity: 'Rudra', startDeg: 66.666667 },
    { index: 6, number: 7, name: 'Punarvasu', sanskrit: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', startDeg: 80 },
    { index: 7, number: 8, name: 'Pushya', sanskrit: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', startDeg: 93.333333 },
    { index: 8, number: 9, name: 'Ashlesha', sanskrit: 'Ashlesha', lord: 'Mercury', deity: 'Sarpa', startDeg: 106.666667 },
    { index: 9, number: 10, name: 'Magha', sanskrit: 'Magha', lord: 'Ketu', deity: 'Pitris', startDeg: 120 },
    { index: 10, number: 11, name: 'Purva Phalguni', sanskrit: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', startDeg: 133.333333 },
    { index: 11, number: 12, name: 'Uttara Phalguni', sanskrit: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', startDeg: 146.666667 },
    { index: 12, number: 13, name: 'Hasta', sanskrit: 'Hasta', lord: 'Moon', deity: 'Savitar', startDeg: 160 },
    { index: 13, number: 14, name: 'Chitra', sanskrit: 'Chitra', lord: 'Mars', deity: 'Tvashtar', startDeg: 173.333333 },
    { index: 14, number: 15, name: 'Swati', sanskrit: 'Swati', lord: 'Rahu', deity: 'Vayu', startDeg: 186.666667 },
    { index: 15, number: 16, name: 'Vishakha', sanskrit: 'Vishakha', lord: 'Jupiter', deity: 'Indra-Agni', startDeg: 200 },
    { index: 16, number: 17, name: 'Anuradha', sanskrit: 'Anuradha', lord: 'Saturn', deity: 'Mitra', startDeg: 213.333333 },
    { index: 17, number: 18, name: 'Jyeshtha', sanskrit: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', startDeg: 226.666667 },
    { index: 18, number: 19, name: 'Mula', sanskrit: 'Mula', lord: 'Ketu', deity: 'Nirriti', startDeg: 240 },
    { index: 19, number: 20, name: 'Purvashadha', sanskrit: 'Purvashadha', lord: 'Venus', deity: 'Apas', startDeg: 253.333333 },
    { index: 20, number: 21, name: 'Uttarashadha', sanskrit: 'Uttarashadha', lord: 'Sun', deity: 'Vishvadevas', startDeg: 266.666667 },
    { index: 21, number: 22, name: 'Shravana', sanskrit: 'Shravana', lord: 'Moon', deity: 'Vishnu', startDeg: 280 },
    { index: 22, number: 23, name: 'Dhanishtha', sanskrit: 'Dhanishtha', lord: 'Mars', deity: 'Vasus', startDeg: 293.333333 },
    { index: 23, number: 24, name: 'Shatabhisha', sanskrit: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', startDeg: 306.666667 },
    { index: 24, number: 25, name: 'Purva Bhadrapada', sanskrit: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', startDeg: 320 },
    { index: 25, number: 26, name: 'Uttara Bhadrapada', sanskrit: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', startDeg: 333.333333 },
    { index: 26, number: 27, name: 'Revati', sanskrit: 'Revati', lord: 'Mercury', deity: 'Pushan', startDeg: 346.666667 },
];
export function calculateNakshatra(siderealLongitude) {
    let longitude = siderealLongitude % 360;
    if (longitude < 0) longitude += 360;
    const nakshatraIndex = Math.floor(longitude / NAKSHATRA_SPAN);
    const degreeInNakshatra = longitude % NAKSHATRA_SPAN;
    const padaIndex = Math.floor(degreeInNakshatra / PADA_SPAN);
    const pada = Math.min(padaIndex + 1, 4);
    const degreeInPada = degreeInNakshatra % PADA_SPAN;
    const nakshatra = NAKSHATRAS[nakshatraIndex];
    return {
        index: nakshatraIndex, number: nakshatra.number, name: nakshatra.name,
        sanskrit: nakshatra.sanskrit, lord: nakshatra.lord, pada,
        degreeInNakshatra, degreeInPada
    };
}
export function getNakshatraLordAbbrev(lord) {
    const lordAbbrevs = {
        'Ketu': 'Ke', 'Venus': 'Ve', 'Sun': 'Su', 'Moon': 'Mo',
        'Mars': 'Ma', 'Rahu': 'Ra', 'Jupiter': 'Ju', 'Saturn': 'Sa', 'Mercury': 'Me',
    };
    return lordAbbrevs[lord] || lord.substring(0, 2);
}
