const config = require('../config/config');

// Item type constants
const ITEMS = {
    ROCKET: 'rocket',
    C4: 'c4',
    SATCHEL: 'satchel',
    EXPLOSIVE_AMMO: 'explosiveammo',
    HV_ROCKET: 'hvrocket'
};

/**
 * Calculates crafting costs for explosive items
 * @param {Object} rustplus - RustPlus instance
 * @param {string} sender - Command sender's name
 * @param {string} message - Full command message
 */
function handleCraftCost(rustplus, sender, message) {
    const [_, item, quantity] = message.split(" ");
    
    if (item && quantity) {
        calculateItemCost(rustplus, sender, item, parseInt(quantity));
    } else {
        listAvailableItems(rustplus);
    }
}

/**
 * Lists all available items that can be crafted
 * @param {Object} rustplus - RustPlus instance
 */
function listAvailableItems(rustplus) {
    rustplus.sendTeamMessage(`GLaDOS: Available items: ${JSON.stringify(Object.keys(config.craftCost))}\n`+
                          `Command format: :craftcost ITEM QUANTITY`);
}

/**
 * Calculates resource costs for crafting specific items
 * @param {Object} rustplus - RustPlus instance
 * @param {string} sender - Command sender's name
 * @param {string} requestedItem - Item to craft
 * @param {number} quantity - Number of items to craft
 */
function calculateItemCost(rustplus, sender, requestedItem, quantity) {
    let response = '';

    switch(requestedItem) {
        case ITEMS.ROCKET:
            response = calculateRocketCost(quantity);
            break;
        case ITEMS.C4:
            response = calculateC4Cost(quantity);
            break;
        case ITEMS.SATCHEL:
            response = calculateSatchelCost(quantity);
            break;
        case ITEMS.EXPLOSIVE_AMMO:
            response = calculateExplosiveAmmoCost(quantity);
            break;
        case ITEMS.HV_ROCKET:
            response = calculateHVRocketCost(quantity);
            break;
        default:
            response = "Unknown explosive item";
            break;
    }

    rustplus.sendTeamMessage(`GLaDOS: ${response}`);
}

/**
 * Calculates costs for rocket crafting
 * @param {number} quantity - Number of rockets to craft
 * @returns {string} Cost breakdown message
 */
function calculateRocketCost(quantity) {
    const rocketGunpowder = config.craftCost.rocket.gunpowder * quantity;
    const rocketExplosive = config.craftCost.rocket.explosive * quantity;
    const explosiveGunpowder = rocketExplosive * config.craftCost.explosive.gunpowder;
    const explosiveSulfur = rocketExplosive * config.craftCost.explosive.sulfur;
    const totalGunpowder = rocketGunpowder + explosiveGunpowder;
    const gunpowderSulfurCost = totalGunpowder * config.craftCost.gunpowder.sulfur;
    const totalSulfurCost = gunpowderSulfurCost + explosiveSulfur;

    return `Rocket crafting costs:\n` +
           `Total gunpowder needed: ${totalGunpowder}\n` +
           `Total sulfur required: ${totalSulfurCost}\n` +
           `- Sulfur for gunpowder: ${gunpowderSulfurCost}\n` +
           `- Sulfur for explosives: ${explosiveSulfur}`;
}

/**
 * Calculates costs for C4 crafting
 * @param {number} quantity - Number of C4 to craft
 * @returns {string} Cost breakdown message
 */
function calculateC4Cost(quantity) {
    const c4Explosive = config.craftCost.c4.explosive * quantity;
    const explosiveGunpowder = c4Explosive * config.craftCost.explosive.gunpowder;
    const explosiveSulfur = c4Explosive * config.craftCost.explosive.sulfur;
    const gunpowderSulfurCost = explosiveGunpowder * config.craftCost.gunpowder.sulfur;
    const totalSulfurCost = gunpowderSulfurCost + explosiveSulfur;

    return `C4 crafting costs:\n` +
           `Total gunpowder needed: ${explosiveGunpowder}\n` +
           `Total sulfur required: ${totalSulfurCost}\n` +
           `- Sulfur for gunpowder: ${gunpowderSulfurCost}\n` +
           `- Sulfur for explosives: ${explosiveSulfur}`;
}

/**
 * Calculates costs for satchel charge crafting
 * @param {number} quantity - Number of satchels to craft
 * @returns {string} Cost breakdown message
 */
function calculateSatchelCost(quantity) {
    const satchelGunpowder = config.craftCost.satchel.gunpowder * quantity;
    const totalSulfurCost = config.craftCost.gunpowder.sulfur * satchelGunpowder;

    return `Satchel charge crafting costs:\n` +
           `Total gunpowder needed: ${satchelGunpowder}\n` +
           `Total sulfur required: ${totalSulfurCost}`;
}

/**
 * Calculates costs for explosive ammo crafting
 * @param {number} quantity - Number of explosive ammo to craft
 * @returns {string} Cost breakdown message
 */
function calculateExplosiveAmmoCost(quantity) {
    const ammoGunpowder = config.craftCost.explosiveammo.gunpowder * quantity;
    const ammoSulfur = config.craftCost.explosiveammo.sulfur * quantity;
    const gunpowderSulfurCost = ammoGunpowder * config.craftCost.gunpowder.sulfur;
    const totalSulfurCost = gunpowderSulfurCost + ammoSulfur;

    return `Explosive ammo crafting costs:\n` +
           `Total gunpowder needed: ${ammoGunpowder}\n` +
           `Total sulfur required: ${totalSulfurCost}\n` +
           `- Sulfur for gunpowder: ${gunpowderSulfurCost}\n` +
           `- Sulfur for explosives: ${ammoSulfur}`;
}

/**
 * Calculates costs for HV rocket crafting
 * @param {number} quantity - Number of HV rockets to craft
 * @returns {string} Cost breakdown message
 */
function calculateHVRocketCost(quantity) {
    const hvRocketGunpowder = config.craftCost.highvelocityrocket.gunpowder * quantity;
    const totalSulfurCost = hvRocketGunpowder * config.craftCost.gunpowder.sulfur;

    return `HV rocket crafting costs:\n` +
           `Total gunpowder needed: ${hvRocketGunpowder}\n` +
           `Total sulfur required: ${totalSulfurCost}`;
}

module.exports = {
    handleCraftCost,
    calculateItemCost
};