const configSU = require('../config/config-su');

/**
 * Updates the map size in the configuration
 * @param {Object} message - The message containing map information
 * @returns {void}
 */
function mapsize(message) {
    try {
        // Validate message structure
        if (!message || !message.response || !message.response.info) {
            console.log("Warning: Invalid message structure received in mapsize");
            return;
        }

        const mapSize = message.response.info.mapSize;
        if (typeof mapSize !== 'number') {
            console.log("Warning: Invalid map size received:", mapSize);
            return;
        }

        // Update server config with new map size
        const currentConfig = configSU.getServer();
        configSU.setServer({
            ...currentConfig,
            mapSize: mapSize
        });

        console.log("Server config updated with mapSize:", mapSize);

    } catch (error) {
        console.error("Error in mapsize function:", error);
    }
}

module.exports = { mapsize };