// Zodiac/Rashi Constants for Vedic Astrology
export const RASHIS = [
    { index: 0, name: 'Aries', sanskrit: 'Mesha', abbrev: 'Ar', lord: 'Mars', element: 'Fire', modality: 'Cardinal' },
    { index: 1, name: 'Taurus', sanskrit: 'Vrishabha', abbrev: 'Ta', lord: 'Venus', element: 'Earth', modality: 'Fixed' },
    { index: 2, name: 'Gemini', sanskrit: 'Mithuna', abbrev: 'Ge', lord: 'Mercury', element: 'Air', modality: 'Mutable' },
    { index: 3, name: 'Cancer', sanskrit: 'Karka', abbrev: 'Cn', lord: 'Moon', element: 'Water', modality: 'Cardinal' },
    { index: 4, name: 'Leo', sanskrit: 'Simha', abbrev: 'Le', lord: 'Sun', element: 'Fire', modality: 'Fixed' },
    { index: 5, name: 'Virgo', sanskrit: 'Kanya', abbrev: 'Vi', lord: 'Mercury', element: 'Earth', modality: 'Mutable' },
    { index: 6, name: 'Libra', sanskrit: 'Tula', abbrev: 'Li', lord: 'Venus', element: 'Air', modality: 'Cardinal' },
    { index: 7, name: 'Scorpio', sanskrit: 'Vrishchika', abbrev: 'Sc', lord: 'Mars', element: 'Water', modality: 'Fixed' },
    { index: 8, name: 'Sagittarius', sanskrit: 'Dhanu', abbrev: 'Sg', lord: 'Jupiter', element: 'Fire', modality: 'Mutable' },
    { index: 9, name: 'Capricorn', sanskrit: 'Makara', abbrev: 'Cp', lord: 'Saturn', element: 'Earth', modality: 'Cardinal' },
    { index: 10, name: 'Aquarius', sanskrit: 'Kumbha', abbrev: 'Aq', lord: 'Saturn', element: 'Air', modality: 'Fixed' },
    { index: 11, name: 'Pisces', sanskrit: 'Meena', abbrev: 'Pi', lord: 'Jupiter', element: 'Water', modality: 'Mutable' },
];
export const RASHI_NAMES = RASHIS.map(r => r.name);
export const RASHI_ABBREVS = RASHIS.map(r => r.abbrev);
export function getRashiByIndex(index) {
    const normalized = ((index % 12) + 12) % 12;
    return RASHIS[normalized];
}
export function getRashiIndex(longitude) {
    const normalized = ((longitude % 360) + 360) % 360;
    return Math.floor(normalized / 30);
}
export function getDegreeInRashi(longitude) {
    const normalized = ((longitude % 360) + 360) % 360;
    return normalized % 30;
}
export function isOddSign(rashiIndex) {
    return rashiIndex % 2 === 0;
}
export function getElement(rashiIndex) {
    const elements = ['Fire', 'Earth', 'Air', 'Water'];
    return elements[rashiIndex % 4];
}
export function getModality(rashiIndex) {
    const modalities = ['Cardinal', 'Fixed', 'Mutable'];
    return modalities[rashiIndex % 3];
}
