// Varga (Divisional) Chart Calculations
import { RASHIS, getRashiIndex, getDegreeInRashi, isOddSign, getElement, getModality } from '../../constants/zodiac.js';
const RASHI_NAMES = RASHIS.map((r) => r.name);
export function calculateD1(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    return { longitude: siderealLongitude, rashiIndex, rashiName: RASHI_NAMES[rashiIndex], degreeInRashi };
}
export function calculateD3(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    let drekkanaRashi;
    if (degreeInRashi < 10) drekkanaRashi = rashiIndex;
    else if (degreeInRashi < 20) drekkanaRashi = (rashiIndex + 4) % 12;
    else drekkanaRashi = (rashiIndex + 8) % 12;
    return { longitude: siderealLongitude, rashiIndex: drekkanaRashi, rashiName: RASHI_NAMES[drekkanaRashi], degreeInRashi: (degreeInRashi % 10) * 3 };
}
export function calculateD7(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const oddSign = isOddSign(rashiIndex);
    const saptamsaSpan = 30 / 7;
    const saptamsaPart = Math.floor(degreeInRashi / saptamsaSpan);
    let d7Rashi;
    if (oddSign) d7Rashi = (rashiIndex + saptamsaPart) % 12;
    else d7Rashi = (rashiIndex + 6 + saptamsaPart) % 12;
    return { longitude: siderealLongitude, rashiIndex: d7Rashi, rashiName: RASHI_NAMES[d7Rashi], degreeInRashi: (degreeInRashi % saptamsaSpan) * 7 };
}
export function calculateD9(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const navamsaSpan = 30 / 9;
    const navamsaPart = Math.floor(degreeInRashi / navamsaSpan);
    const element = getElement(rashiIndex);
    let startingSign;
    switch (element) {
        case 'Fire': startingSign = 0; break;
        case 'Earth': startingSign = 9; break;
        case 'Air': startingSign = 6; break;
        case 'Water': startingSign = 3; break;
        default: startingSign = 0;
    }
    const d9Rashi = (startingSign + navamsaPart) % 12;
    return { longitude: siderealLongitude, rashiIndex: d9Rashi, rashiName: RASHI_NAMES[d9Rashi], degreeInRashi: (degreeInRashi % navamsaSpan) * 9 };
}
export function calculateD10(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const oddSign = isOddSign(rashiIndex);
    const dasamsaPart = Math.floor(degreeInRashi / 3);
    let d10Rashi;
    if (oddSign) d10Rashi = (rashiIndex + dasamsaPart) % 12;
    else d10Rashi = (rashiIndex + 8 + dasamsaPart) % 12;
    return { longitude: siderealLongitude, rashiIndex: d10Rashi, rashiName: RASHI_NAMES[d10Rashi], degreeInRashi: (degreeInRashi % 3) * 10 };
}
export function calculateD12(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const d12Part = Math.floor(degreeInRashi / 2.5);
    const d12Rashi = (rashiIndex + d12Part) % 12;
    return { longitude: siderealLongitude, rashiIndex: d12Rashi, rashiName: RASHI_NAMES[d12Rashi], degreeInRashi: (degreeInRashi % 2.5) * 12 };
}
export function calculateD16(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const d16Part = Math.floor(degreeInRashi / 1.875);
    const modality = getModality(rashiIndex);
    let startingSign;
    switch (modality) {
        case 'Cardinal': startingSign = 0; break;
        case 'Fixed': startingSign = 4; break;
        case 'Mutable': startingSign = 8; break;
        default: startingSign = 0;
    }
    const d16Rashi = (startingSign + d16Part) % 12;
    return { longitude: siderealLongitude, rashiIndex: d16Rashi, rashiName: RASHI_NAMES[d16Rashi], degreeInRashi: (degreeInRashi % 1.875) * 16 };
}
export function calculateD20(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const d20Part = Math.floor(degreeInRashi / 1.5);
    const modality = getModality(rashiIndex);
    let startingSign;
    switch (modality) {
        case 'Cardinal': startingSign = 0; break;
        case 'Fixed': startingSign = 8; break;
        case 'Mutable': startingSign = 4; break;
        default: startingSign = 0;
    }
    const d20Rashi = (startingSign + d20Part) % 12;
    return { longitude: siderealLongitude, rashiIndex: d20Rashi, rashiName: RASHI_NAMES[d20Rashi], degreeInRashi: (degreeInRashi % 1.5) * 20 };
}
export function calculateD24(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const oddSign = isOddSign(rashiIndex);
    const d24Part = Math.floor(degreeInRashi / 1.25);
    const startingSign = oddSign ? 4 : 3;
    const d24Rashi = (startingSign + d24Part) % 12;
    return { longitude: siderealLongitude, rashiIndex: d24Rashi, rashiName: RASHI_NAMES[d24Rashi], degreeInRashi: (degreeInRashi % 1.25) * 24 };
}
export function calculateD30(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const oddSign = isOddSign(rashiIndex);
    let d30Rashi;
    if (oddSign) {
        if (degreeInRashi < 5) d30Rashi = 0;
        else if (degreeInRashi < 10) d30Rashi = 10;
        else if (degreeInRashi < 18) d30Rashi = 8;
        else if (degreeInRashi < 25) d30Rashi = 2;
        else d30Rashi = 1;
    } else {
        if (degreeInRashi < 5) d30Rashi = 1;
        else if (degreeInRashi < 12) d30Rashi = 5;
        else if (degreeInRashi < 20) d30Rashi = 11;
        else if (degreeInRashi < 25) d30Rashi = 9;
        else d30Rashi = 7;
    }
    return { longitude: siderealLongitude, rashiIndex: d30Rashi, rashiName: RASHI_NAMES[d30Rashi], degreeInRashi };
}
export function calculateD45(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const d45Span = 30 / 45;
    const d45Part = Math.floor(degreeInRashi / d45Span);
    const modality = getModality(rashiIndex);
    let startingSign;
    switch (modality) {
        case 'Cardinal': startingSign = 0; break;
        case 'Fixed': startingSign = 4; break;
        case 'Mutable': startingSign = 8; break;
        default: startingSign = 0;
    }
    const d45Rashi = (startingSign + d45Part) % 12;
    return { longitude: siderealLongitude, rashiIndex: d45Rashi, rashiName: RASHI_NAMES[d45Rashi], degreeInRashi: (degreeInRashi % d45Span) * 45 };
}
export function calculateD60(siderealLongitude) {
    const rashiIndex = getRashiIndex(siderealLongitude);
    const degreeInRashi = getDegreeInRashi(siderealLongitude);
    const d60Part = Math.floor(degreeInRashi / 0.5);
    const d60Rashi = (rashiIndex + d60Part) % 12;
    return { longitude: siderealLongitude, rashiIndex: d60Rashi, rashiName: RASHI_NAMES[d60Rashi], degreeInRashi: (degreeInRashi % 0.5) * 60 };
}
export function calculateD81(siderealLongitude) {
    const d9Position = calculateD9(siderealLongitude);
    const d9Longitude = (d9Position.rashiIndex * 30) + d9Position.degreeInRashi;
    return calculateD9(d9Longitude);
}
export function calculateAllVargas(siderealLongitude) {
    return {
        D1: calculateD1(siderealLongitude), D3: calculateD3(siderealLongitude),
        D7: calculateD7(siderealLongitude), D9: calculateD9(siderealLongitude),
        D10: calculateD10(siderealLongitude), D12: calculateD12(siderealLongitude),
        D16: calculateD16(siderealLongitude), D20: calculateD20(siderealLongitude),
        D24: calculateD24(siderealLongitude), D30: calculateD30(siderealLongitude),
        D45: calculateD45(siderealLongitude), D60: calculateD60(siderealLongitude),
        D81: calculateD81(siderealLongitude)
    };
}
