// Swiss Ephemeris Constants for Vedic Astrology
export const SwissEphConstants = {
    SE_SUN: 0, SE_MOON: 1, SE_MERCURY: 2, SE_VENUS: 3, SE_MARS: 4,
    SE_JUPITER: 5, SE_SATURN: 6, SE_URANUS: 7, SE_NEPTUNE: 8, SE_PLUTO: 9,
    SE_MEAN_NODE: 10, SE_TRUE_NODE: 11,
    SE_JUL_CAL: 0, SE_GREG_CAL: 1,
    SEFLG_SPEED: 256, SEFLG_SIDEREAL: 64 * 1024,
    SE_SIDM_LAHIRI: 1, SE_SIDM_TRUE_CITRA: 27,
    HOUSE_SYSTEM_EQUAL: 'E'.charCodeAt(0),
    HOUSE_SYSTEM_WHOLE_SIGN: 'W'.charCodeAt(0),
    HOUSE_SYSTEM_PLACIDUS: 'P'.charCodeAt(0),
};
export const VEDIC_PLANETS = [
    { id: 0, name: 'Sun', sanskrit: 'Surya', abbrev: 'Su' },
    { id: 1, name: 'Moon', sanskrit: 'Chandra', abbrev: 'Mo' },
    { id: 4, name: 'Mars', sanskrit: 'Mangala', abbrev: 'Ma' },
    { id: 2, name: 'Mercury', sanskrit: 'Budha', abbrev: 'Me' },
    { id: 5, name: 'Jupiter', sanskrit: 'Guru', abbrev: 'Ju' },
    { id: 3, name: 'Venus', sanskrit: 'Shukra', abbrev: 'Ve' },
    { id: 6, name: 'Saturn', sanskrit: 'Shani', abbrev: 'Sa' },
    { id: 10, name: 'Rahu', sanskrit: 'Rahu', abbrev: 'Ra' },
    { id: -1, name: 'Ketu', sanskrit: 'Ketu', abbrev: 'Ke' },
];
