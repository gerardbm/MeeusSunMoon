import * as auxMath from './auxMath.js';
import * as timeConversions from './timeConversions.js';

/**
 * Calculates the Julian date in ephemeris time of the moon near the date
 * corresponding to k (see AA p350ff).
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @param {int} phase 0 -> new moon, 1 -> first quarter,
 *                    2 -> full moon, 3 -> last quarter.
 * @returns {number} Julian date in ephemeris time of the moon of given phase.
 */
const truePhase = function (k, phase) {
    k += phase / 4;
    const T = timeConversions.kToT(k);
    const E = eccentricityCorrection(T);
    const JDE = meanPhase(T, k);
    const M = sunMeanAnomaly(T, k);
    const MPrime = moonMeanAnomaly(T, k);
    const F = moonArgumentOfLatitude(T, k);
    const Omega = moonAscendingNodeLongitude(T, k);
    const A = planetaryArguments(T, k);
    let DeltaJDE = 0;
    if (phase === 0 || phase === 2) {
        DeltaJDE += newMoonFullMoonCorrections(E, M, MPrime, F, Omega, phase);
    } else if (phase === 1 || phase === 3) {
        DeltaJDE += quarterCorrections(E, M, MPrime, F, Omega, phase);
    }
    DeltaJDE += commonCorrections(A);
    return JDE + DeltaJDE;
};

/**
 * Calculates the mean phase of the moon as Julian date in ephemeris time (see
 * AA p349 Eq49.1).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @returns {number} Julian date in ephemeris time of the moon of given mean
 *     phase.
 */
const meanPhase = function (T, k) {
    return 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.000000150 * T * T * T +
        0.00000000073 * T * T * T * T;
};

/**
 * Calculates the mean anomaly of the sun (see AA p350 Eq49.4).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @returns {number} Mean anomaly of the sun at the given time.
 */
const sunMeanAnomaly = function (T, k) {
    return 2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T * T * T;
};

/**
 * Calculates the mean anomaly of the moon (see AA p350 Eq49.5).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @returns {number} Mean anomaly of the moon at the given time.
 */
const moonMeanAnomaly = function (T, k) {
    return 201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T - 0.000000058 * T * T * T * T;
};

/**
 * Calculates the argument of latitude of the moon (see AA p350 Eq49.6).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @returns {number} Argument of latitude of the moon at the given time.
 */
const moonArgumentOfLatitude = function (T, k) {
    return 160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T * T * T + 0.000000011 * T * T * T * T;
};

/**
 * Calculates the longitude of the ascending node of the lunar orbit (see AA
 * p350 Eq49.7).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @returns {number} Longitude of the ascending node of the lunar orbit at the
 *     given time.
 */
const moonAscendingNodeLongitude = function (T, k) {
    return 124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T;
};

/**
 * Calculates the correction for the eccentricity of the earth's orbit.
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Eccentricity correction.
 */
const eccentricityCorrection = function (T) {
    return 1 - 0.002516 * T - 0.0000074 * T * T;
};

/**
 * Calculates the planetary arguments for the moon phases (see AA p351).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} k The approximate fractional number of new moons since
 *     2000-01-06.
 * @returns {array} Planetary arguments for the moon phases.
 */
const planetaryArguments = function (T, k) {
    // Want to follow the numbering conventions from AA
    return [
        0,
        299.77 + 0.107408 * k - 0.009173 * T * T,
        251.88 + 0.016321 * k,
        251.83 + 26.651886 * k,
        349.42 + 36.412478 * k,
        84.66 + 18.206239 * k,
        141.74 + 53.303771 * k,
        207.14 + 2.453732 * k,
        154.84 + 7.306860 * k,
        34.52 + 27.261239 * k,
        207.19 + 0.121824 * k,
        291.34 + 1.844379 * k,
        161.72 + 24.198154 * k,
        239.56 + 25.513099 * k,
        331.55 + 3.592518 * k,
    ];
};

/**
 * Calculates the corrections to the planetary arguments for the moon phases
 * that are common to all phases (see AA p352).
 * @param {array} A Array of planetary arguments
 * @returns {number} Correction to the Julian date in ephemeris time for the
 *     moon phase.
 */
const commonCorrections = function (A) {
    return 0.000325 * auxMath.sind(A[1]) +
        0.000165 * auxMath.sind(A[2]) +
        0.000164 * auxMath.sind(A[3]) +
        0.000126 * auxMath.sind(A[4]) +
        0.000110 * auxMath.sind(A[5]) +
        0.000062 * auxMath.sind(A[6]) +
        0.000060 * auxMath.sind(A[7]) +
        0.000056 * auxMath.sind(A[8]) +
        0.000047 * auxMath.sind(A[9]) +
        0.000042 * auxMath.sind(A[10]) +
        0.000040 * auxMath.sind(A[11]) +
        0.000037 * auxMath.sind(A[12]) +
        0.000035 * auxMath.sind(A[13]) +
        0.000023 * auxMath.sind(A[14]);
};

/**
 * Calculates the corrections to the planetary arguments for the moon phases
 * for full and new moons (see AA p351).
 * @param {number} E Correction for the eccentricity of the earth's orbit.
 * @param {number} M Mean anomaly of the sun.
 * @param {number} MPrime Mean anomaly of the moon.
 * @param {number} F Argument of latitude of the moon.
 * @param {number} Omega Longitude of the ascending node of the lunar orbit.
 * @param {int} phase 0 -> new moon, 1 -> first quarter,
 *                    2 -> full moon, 3 -> last quarter.
 * @returns {number} Correction to the Julian date in ephemeris time for the
 *     moon phase.
 */
const newMoonFullMoonCorrections = function (E, M, MPrime, F, Omega, phase) {
    let DeltaJDE =
        -0.00111 * auxMath.sind(MPrime - 2 * F) -
        0.00057 * auxMath.sind(MPrime + 2 * F) +
        0.00056 * E * auxMath.sind(2 * MPrime + M) -
        0.00042 * auxMath.sind(3 * MPrime) +
        0.00042 * E * auxMath.sind(M + 2 * F) +
        0.00038 * E * auxMath.sind(M - 2 * F) -
        0.00024 * E * auxMath.sind(2 * MPrime - M) -
        0.00017 * auxMath.sind(Omega) -
        0.00007 * auxMath.sind(MPrime + 2 * M) +
        0.00004 * auxMath.sind(2 * MPrime - 2 * F) +
        0.00004 * auxMath.sind(3 * M) +
        0.00003 * auxMath.sind(MPrime + M - 2 * F) +
        0.00003 * auxMath.sind(2 * MPrime + 2 * F) -
        0.00003 * auxMath.sind(MPrime + M + 2 * F) +
        0.00003 * auxMath.sind(MPrime - M + 2 * F) -
        0.00002 * auxMath.sind(MPrime - M - 2 * F) -
        0.00002 * auxMath.sind(3 * MPrime + M) +
        0.00002 * auxMath.sind(4 * MPrime);
    if (phase === 0) {
        DeltaJDE +=
            -0.40720 * auxMath.sind(MPrime) +
            0.17241 * E * auxMath.sind(M) +
            0.01608 * auxMath.sind(2 * MPrime) +
            0.01039 * auxMath.sind(2 * F) +
            0.00739 * E * auxMath.sind(MPrime - M) -
            0.00514 * E * auxMath.sind(MPrime + M) +
            0.00208 * E * E * auxMath.sind(2 * M);
    } else if (phase === 2) {
        DeltaJDE +=
            -0.40614 * auxMath.sind(MPrime) +
            0.17302 * E * auxMath.sind(M) +
            0.01614 * auxMath.sind(2 * MPrime) +
            0.01043 * auxMath.sind(2 * F) +
            0.00734 * E * auxMath.sind(MPrime - M) -
            0.00515 * E * auxMath.sind(MPrime + M) +
            0.00209 * E * E * auxMath.sind(2 * M);
    }
    return DeltaJDE;
};

/**
 * Calculates the corrections to the planetary arguments for the moon phases
 * for first and last quarters (see AA p352).
 * @param {number} E Correction for the eccentricity of the earth's orbit.
 * @param {number} M Mean anomaly of the sun.
 * @param {number} MPrime Mean anomaly of the moon.
 * @param {number} F Argument of latitude of the moon.
 * @param {number} Omega Longitude of the ascending node of the lunar orbit.
 * @param {int} phase 0 -> new moon, 1 -> first quarter,
 *                    2 -> full moon, 3 -> last quarter.
 * @returns {number} Correction to the Julian date in ephemeris time for the
 *     moon phase.
 */
const quarterCorrections = function (E, M, MPrime, F, Omega, phase) {
    let DeltaJDE =
        -0.62801 * auxMath.sind(MPrime) +
        0.17172 * E * auxMath.sind(M) -
        0.01183 * E * auxMath.sind(MPrime + M) +
        0.00862 * auxMath.sind(2 * MPrime) +
        0.00804 * auxMath.sind(2 * F) +
        0.00454 * E * auxMath.sind(MPrime - M) +
        0.00204 * E * E * auxMath.sind(2 * M) -
        0.00180 * auxMath.sind(MPrime - 2 * F) -
        0.00070 * auxMath.sind(MPrime + 2 * F) -
        0.00040 * auxMath.sind(3 * MPrime) -
        0.00034 * E * auxMath.sind(2 * MPrime - M) +
        0.00032 * E * auxMath.sind(M + 2 * F) +
        0.00032 * E * auxMath.sind(M - 2 * F) -
        0.00028 * E * E * auxMath.sind(MPrime + 2 * M) +
        0.00027 * E * auxMath.sind(2 * MPrime + M) -
        0.00017 * auxMath.sind(Omega) -
        0.00005 * auxMath.sind(MPrime - M - 2 * F) +
        0.00004 * auxMath.sind(2 * MPrime + 2 * F) -
        0.00004 * auxMath.sind(MPrime + M + 2 * F) +
        0.00004 * auxMath.sind(MPrime - 2 * M) +
        0.00003 * auxMath.sind(MPrime + M - 2 * F) +
        0.00003 * auxMath.sind(3 * M) +
        0.00002 * auxMath.sind(2 * MPrime - 2 * F) +
        0.00002 * auxMath.sind(MPrime - M + 2 * F) -
        0.00002 * auxMath.sind(3 * MPrime + M);
    const W =
        0.00306 -
        0.00038 * E * auxMath.cosd(M) +
        0.00026 * auxMath.cosd(MPrime) -
        0.00002 * auxMath.cosd(MPrime - M) +
        0.00002 * auxMath.cosd(MPrime + M) +
        0.00002 * auxMath.cosd(2 * F);
    if (phase === 1) {
        DeltaJDE += W;
    } else if (phase === 3) {
        DeltaJDE -= W;
    }
    return DeltaJDE;
};

export { truePhase };
