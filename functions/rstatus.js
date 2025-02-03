const NodePrefs = require('node-prefs');

/**
 * Gets and reports the status of all registered devices
 * @param {Object} rustplus - RustPlus instance
 * @param {string} sender - Command sender's name
 */
const handleDeviceStatus = async (rustplus, sender) => {
    const devicePrefs = new NodePrefs({fileName: "config-dis.js"});
    const deviceConfig = devicePrefs.entries();
    console.log('Device configuration:', deviceConfig);

    /**
     * Gets the status of a specific entity
     * @param {string} id - Entity ID
     * @returns {Promise<string>} Entity status ('active' or 'inactive')
     */
    const getEntityStatus = (id) => {
        return new Promise((resolve) => {
            rustplus.getEntityInfo(id, (message) => {
                const status = message.response.entityInfo.payload.value ? "active" : "inactive";
                resolve(status);
            });
        });
    };

    /**
     * Ensures connection to Rust server is established
     * @returns {Promise<void>}
     */
    const ensureConnection = () => {
        return new Promise((resolve) => {
            if (rustplus.isConnected()) {
                resolve();
            } else {
                rustplus.once('connected', () => resolve());
                rustplus.connect();
            }
        });
    };

    try {
        // Ensure we're connected before proceeding
        await ensureConnection();

        // Check status for each device
        for (const [deviceName, deviceId] of deviceConfig) {
            console.log('Processing device:', deviceName, 'ID:', deviceId);
            console.log(`Checking status for ${deviceName} (ID: ${deviceId})`);

            try {
                const deviceStatus = await getEntityStatus(deviceId);
                console.log(`Status received for ${deviceName}: ${deviceStatus}`);
                rustplus.sendTeamMessage(`GLaDOS: Status of ${deviceName} is ${deviceStatus} ${sender}`);
            } catch (error) {
                console.error(`Error checking status for ${deviceName}:`, error);
                rustplus.sendTeamMessage(`GLaDOS: Error getting status of ${deviceName} ${sender}`);
            }
        }
    } catch (error) {
        console.error("Connection error:", error);
        rustplus.sendTeamMessage(`GLaDOS: Connection error while checking status ${sender}`);
    }
};

module.exports = handleDeviceStatus;