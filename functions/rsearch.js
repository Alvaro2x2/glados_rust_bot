const itemsConfig = require('../config/items_config');
const rpositionHandler = require('./rposition');
const configSU = require('../config/config-su'); 

/**
 * Searches for items in vending machines across the map with price filtering
 * @param {Object} rustplus - RustPlus instance for game interaction
 * @param {Object} sender - Message sender information
 * @param {string} itemName - Name of the item to search for
 * @param {number} quantity - Desired quantity of the item
 * @param {string} costItem - Currency item name
 * @param {number} maxCost - Maximum cost per item in the specified currency
 * @param {boolean} [silent=false] - If true, don't send messages for non-matching items
 * @returns {Promise<{itemId: number, matches: Array}>} Returns itemId and matching offers
 */
async function rsearch(rustplus, sender, itemName, quantity = 1, costItem = null, maxCost = null, silent = false) {
  return new Promise(async (resolve) => {
    const matches = [];
    try {
      // Check if items exist in configuration
      const item = itemsConfig.items[itemName];
      const costItemConfig = costItem ? itemsConfig.items[costItem] : null;

      if (!item) {
        if (!silent) rustplus.sendTeamMessage(`GLaDOS: Item ${itemName} not found`);
        resolve({ itemId: null, matches: [] });
        return;
      }

      if (costItem && !costItemConfig) {
        if (!silent) rustplus.sendTeamMessage(`GLaDOS: Currency item ${costItem} not found`);
        resolve({ itemId: null, matches: [] });
        return;
      }

      const itemId = item.itemId;
      const costItemId = costItemConfig ? costItemConfig.itemId : null;

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

              // Check if the order meets price criteria
              const meetsPrice = !costItemId || (
                order.currencyId === costItemId && 
                order.costPerItem <= maxCost
              );

              const meetsQuantity = order.quantity >= quantity;

              const grid = rpositionHandler.getGrid(vendingMachine.x, vendingMachine.y, configSU.getServer().mapSize);

              if (meetsPrice && meetsQuantity) {
                matches.push({
                  grid,
                  quantity: order.quantity,
                  costPerItem: order.costPerItem,
                  currencyName,
                  amountInStock: order.amountInStock
                });

                if (!silent) {
                  const message = `GLaDOS: x${order.quantity} :${itemName}: at ${grid} - Price: ${order.costPerItem} ${currencyName} - Stock: ${order.amountInStock}`;
                  rustplus.sendTeamMessage(message);
                  console.log(`Search result: ${message}`);
                  // Wait 100ms before sending next message to avoid rate limiting
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }
            }
          }
        }

        resolve({ itemId, matches });
      });
    } catch (error) {
      console.error('Error in rsearch:', error);
      if (!silent) rustplus.sendTeamMessage(`GLaDOS Error: ${error.message}`);
      resolve({ itemId: null, matches: [] });
    }
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
