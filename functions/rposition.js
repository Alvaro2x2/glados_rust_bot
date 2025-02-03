const gridDiameter = 146.25;

function getGrid(x, y, mapSize) {
    const correctedMapSize = getCorrectedMapSize(mapSize);

    /* Outside the grid system check */
    //if (isOutsideGridSystem(x, y, correctedMapSize)) {
    //   return null;
    //}

    const gridPosLetters = getGridPosLettersX(x, correctedMapSize);
    const gridPosNumber = getGridPosNumberY(y, correctedMapSize);

    return gridPosLetters + gridPosNumber;
}

/**
 * Calculates grid position letters based on X coordinate
 * @param {number} x - X coordinate
 * @param {number} mapSize - Total map size
 * @returns {string} Grid position letters
 */
function getGridPosLettersX(x, mapSize) {
    let counter = 1;
    for (let startGrid = 0; startGrid < mapSize; startGrid += gridDiameter) {
        if (x >= startGrid && x <= (startGrid + gridDiameter)) {
            /* Found correct grid! */
            return numberToLetters(counter);
        }
        counter++;
    }
}

/**
 * Calculates grid position number based on Y coordinate
 * @param {number} y - Y coordinate
 * @param {number} mapSize - Total map size
 * @returns {number} Grid position number
 */
function getGridPosNumberY(y, mapSize) {
    let counter = 1;
    const numberOfGrids = Math.floor(mapSize / gridDiameter);
    for (let startGrid = 0; startGrid < mapSize; startGrid += gridDiameter) {
        if (y >= startGrid && y <= (startGrid + gridDiameter)) {
            /* Found correct grid! */
            return numberOfGrids - counter;
        }
        counter++;
    }
}

/**
 * Converts a number to letter grid coordinates
 * @param {number} num - Number to convert
 * @returns {string} Letter grid coordinates
 */
function numberToLetters(num) {
    const mod = num % 26;
    let pow = num / 26 | 0;
    const out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
    return pow ? numberToLetters(pow) + out : out;
}

/**
 * Gets corrected map size accounting for grid diameter
 * @param {number} mapSize - Original map size
 * @returns {number} Corrected map size
 */
function getCorrectedMapSize(mapSize) {
    const remainder = mapSize % gridDiameter;
    const offset = gridDiameter - remainder;
    return (remainder < 120) ? mapSize - remainder : mapSize + offset;
}

module.exports = { getGrid };