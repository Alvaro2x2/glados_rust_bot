const config = require('../config/config');
const NodePrefs = require('node-prefs');

/**
 * Handles device control commands (on/off)
 * @param {Object} rustplus - RustPlus instance
 * @param {string} command - Full command message
 * @param {string} sender - Command sender's name
 */
const handleDeviceControl = (rustplus, command, sender) => {
    // Initialize device preferences
    const devicePrefs = new NodePrefs({fileName: "config-dis.js"});
    
    // Parse command
    const [action, deviceName] = command.split(" ", 2);
    const isOffCommand = action === ":off";
    
    // Check if device exists
    if (devicePrefs.has(deviceName)) {
        const deviceId = devicePrefs.get(deviceName);
        
        // Execute device control
        if (isOffCommand) {
            console.log(`Device control: Deactivating ${deviceName} (ID: ${deviceId})`);
            rustplus.turnSmartSwitchOff(deviceId, (message) => {});
            rustplus.sendTeamMessage(`GLaDOS: ${deviceName} has been deactivated by ${sender}`);
        } else {
            console.log(`Device control: Activating ${deviceName} (ID: ${deviceId})`);
            rustplus.turnSmartSwitchOn(deviceId, (message) => {});
            rustplus.sendTeamMessage(`GLaDOS: ${deviceName} has been activated by ${sender}`);
        }
    } else {
        console.log(`Device control: Device '${deviceName}' not found in preferences`);
        rustplus.sendTeamMessage(`GLaDOS: Device '${deviceName}' not found. Please check the name or save it first.`);
    }
};

module.exports = handleDeviceControl;