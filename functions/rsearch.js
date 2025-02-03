const itemsConfig = require('../config/items_config');
const rpositionHandler = require('./rposition');
const configSU = require('../config/config-su'); 

/**
 * Searches for items in vending machines across the map
 * @param {Object} rustplus - RustPlus instance for game interaction
 * @param {Object} sender - Message sender information
 * @param {string} itemName - Name of the item to search for
 * @returns {Promise<number|null>} Returns itemId if found, null if not found
 */
async function rsearch(rustplus, sender, itemName) {
  return new Promise((resolve) => {
    // Check if item exists in configuration
    const item = itemsConfig.items[itemName];

    if (!item) {
      rustplus.sendTeamMessage(`GLaDOS: Item ${itemName} not found`);
      resolve(null);
      return;
    }

    const itemId = item.itemId;

    // Get all map markers
    rustplus.getMapMarkers(async (mapData) => {
      // Filter for active vending machines (type 3)
      const vendingMachines = mapData.response.mapMarkers.markers.filter(
        (marker) => !marker.outOfStock && marker.type === 3
      );

      // Check each vending machine for the requested item
      for (const vendingMachine of vendingMachines) {
        for (const order of vendingMachine.sellOrders) {
          if (order.itemId === itemId && order.amountInStock > 0) {
            const currencyName = getItemDisplayName(order.currencyId);

            if (!currencyName) {
              console.log(`Currency with itemId ${order.currencyId} not found in configuration`);
              continue;
            }

            const grid = rpositionHandler.getGrid(vendingMachine.x, vendingMachine.y, configSU.getServer().mapSize);

            // Send item location and price information
            const message = `GLaDOS: x${order.quantity} :${itemName}: at ${grid} - Price: ${order.costPerItem} ${currencyName} - Stock: ${order.amountInStock}`;
            rustplus.sendTeamMessage(message);
            console.log(`Search result: ${message}`);

            // Wait 100ms before sending next message to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      resolve(itemId);
    });
  });
}

/**
 * Gets the display name of an item by its ID
 * @param {number} itemId - The ID of the item to look up
 * @returns {string|null} The display name of the item, or null if not found
 */
function getItemDisplayName(itemId) {
  for (const itemName in itemsConfig.items) {
    if (itemsConfig.items[itemName].itemId === itemId) {
      return itemsConfig.items[itemName].displayName;
    }
  }
  return null;
}

module.exports = { rsearch, getItemDisplayName };