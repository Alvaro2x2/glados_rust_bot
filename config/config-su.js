const NodePrefs = require('node-prefs');
const fs = require('fs');
const path = require('path');

// Initialize NodePrefs for server and user configurations
const CONFIG_DIR = process.cwd();
const CONFIG_FILE = "config-sus.js";
const CONFIG_PATH = path.join(CONFIG_DIR, CONFIG_FILE);

// Function to read directly from file
function readConfigFile() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const content = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error reading config file:', error);
    }
    return null;
}

// Function to write directly to file
function writeConfigFile(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing config file:', error);
        return false;
    }
}

// Singleton instance for NodePrefs
let prefsInstance = null;
function getPrefs() {
    if (!prefsInstance) {
        prefsInstance = new NodePrefs({
            fileName: CONFIG_FILE,
            logging: true,
            filePath: CONFIG_DIR
        });
    }
    return prefsInstance;
}

// Ensure configuration file exists
function ensureConfigFile() {
    try {
        let config = readConfigFile();
        if (!config) {
            console.log(`Creating new config file at: ${CONFIG_PATH}`);
            config = {
                user: null,
                server: null
            };
            writeConfigFile(config);
        }

        // Synchronize NodePrefs with file
        const prefs = getPrefs();
        prefs.clear();
        if (config.user) prefs.set('user', config.user);
        if (config.server) prefs.set('server', config.server);

        return true;
    } catch (error) {
        console.error('Error ensuring config file:', error);
        return false;
    }
}

// Server configuration validation function
function validateServerConfig(config, isGet = false) {
    if (config === null || config === undefined) {
        return null;
    }
    
    if (config && typeof config === 'object') {
        if (!config.ip || !config.port) {
            return config;
        }
        if (!config.ip.match(/^(?:\d{1,3}\.){3}\d{1,3}$/) || config.port < 0 || config.port > 65535) {
            throw new Error('Invalid IP or port in server configuration');
        }
    }
    
    return config;
}

// User configuration validation function
function validateUserConfig(config, isGet = false) {
    if (config === null || config === undefined) {
        return null;
    }
    
    if (config && typeof config === 'object') {
        if (!config.steamid || !config.token) {
            return config;
        }
    }
    
    return config;
}

// Functions to get configurations
function getServer() {
    ensureConfigFile();
    
    // Read directly from file
    const fileConfig = readConfigFile();
    if (!fileConfig) return null;
    
    const config = fileConfig.server;
    //console.log('Server config from file:', config);
    return validateServerConfig(config, true);
}

function getUser() {
    ensureConfigFile();
    
    // Read directly from file
    const fileConfig = readConfigFile();
    if (!fileConfig) return null;
    
    const config = fileConfig.user;
    //console.log('User config from file:', config);
    return validateUserConfig(config, true);
}

// Functions to set configurations
function setServer(config) {
    ensureConfigFile();
    
    console.log('Setting server configuration:', config);
    const fileConfig = readConfigFile() || {};
    fileConfig.server = {
        ...fileConfig.server,
        ...config
    };
    
    const validatedConfig = validateServerConfig(fileConfig.server);
    fileConfig.server = validatedConfig;
    
    if (writeConfigFile(fileConfig)) {
        // Synchronize NodePrefs
        const prefs = getPrefs();
        prefs.set('server', validatedConfig);
        console.log('Server configuration updated successfully');
    }
}

function setUser(config) {
    ensureConfigFile();
    
    console.log('Setting user configuration:', config);
    const fileConfig = readConfigFile() || {};
    fileConfig.user = {
        ...fileConfig.user,
        ...config
    };
    
    const validatedConfig = validateUserConfig(fileConfig.user);
    fileConfig.user = validatedConfig;
    
    if (writeConfigFile(fileConfig)) {
        // Synchronize NodePrefs
        const prefs = getPrefs();
        prefs.set('user', validatedConfig);
        console.log('User configuration updated successfully');
    }
}

// Debug utility function
function dumpConfig() {
    const fileConfig = readConfigFile();
    console.log('Current file configuration:', JSON.stringify(fileConfig, null, 2));
    return fileConfig;
}

module.exports = {
    getServer,
    getUser,
    setServer,
    setUser,
    dumpConfig
};
