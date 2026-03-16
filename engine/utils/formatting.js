// Utility functions for formatting degrees, minutes, seconds
export function degreesToDMS(decimalDegrees) {
    const sign = decimalDegrees >= 0 ? 1 : -1;
    const abs = Math.abs(decimalDegrees);
    const degrees = Math.floor(abs);
    const remainingMinutes = (abs - degrees) * 60;
    const minutes = Math.floor(remainingMinutes);
    const seconds = (remainingMinutes - minutes) * 60;
    return { degrees, minutes, seconds, sign };
}
export function dmsToDecimal(degrees, minutes, seconds) {
    return degrees + (minutes / 60) + (seconds / 3600);
}
export function formatDMS(dms, style = 'symbol') {
    const secRounded = Math.round(dms.seconds);
    if (style === 'symbol') {
        return `${dms.degrees}\u00b0${dms.minutes}'${secRounded}"`;
    }
    else {
        return `${dms.degrees}:${String(dms.minutes).padStart(2, '0')}:${String(secRounded).padStart(2, '0')}`;
    }
}
export function formatLongitude(longitude, rashiAbbrevs) {
    const normalized = ((longitude % 360) + 360) % 360;
    const rashiIndex = Math.floor(normalized / 30);
    const degreeInRashi = normalized % 30;
    const dms = degreesToDMS(degreeInRashi);
    const rashiAbbrev = rashiAbbrevs[rashiIndex];
    return `${rashiAbbrev} ${formatDMS(dms)}`;
}
export function compareDegrees(actual, expected, toleranceArcseconds = 1) {
    const diffDegrees = Math.abs(actual - expected);
    const diffArcseconds = diffDegrees * 3600;
    return diffArcseconds <= toleranceArcseconds;
}
export function getDifferenceArcseconds(actual, expected) {
    return Math.abs(actual - expected) * 3600;
}
