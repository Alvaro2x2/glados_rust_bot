const NodePrefs = require('node-prefs');

// Initialize NodePrefs for server and user configurations
const prefs = new NodePrefs({fileName: "config-sus.js"});

// Server configuration validation function
function validateServerConfig(config) {
    if (!config) {
        throw new Error('Server configuration not found');
    }
    if (!config.ip || !config.port) {
        throw new Error('Server configuration must include IP and port');
    }
    if (!config.ip.match(/^(?:\d{1,3}\.){3}\d{1,3}$/) || config.port < 0 || config.port > 65535) {
        throw new Error('Invalid IP or port in server configuration');
    }
}

// User configuration validation function
function validateUserConfig(config) {
    if (!config) {
        throw new Error('User configuration not found');
    }
    if (!config.steamid || !config.token) {
        throw new Error('User configuration must include steamid and token');
    }
}

// Functions to get configurations
function getServer() {
    // prefs.get() siempre lee del archivo
    let prefs2 = new NodePrefs({fileName: "config-sus.js"});
    const config = prefs2.get('server');
    validateServerConfig(config);
    return config;
}

function getUser() {
    const config = prefs.get('user');
    validateUserConfig(config);
    return config;
}

// Functions to set configurations
function setServer(config) {
    const prefs2 = new NodePrefs({fileName: "config-sus.js"});
    const newConfig = {
        ...prefs2.get('server'),
        ...config
    };
    validateServerConfig(newConfig);
    prefs2.set('server', newConfig);
}

function setUser(config) {
    const newConfig = {
        ...getUser(),
        ...config
    };
    validateUserConfig(newConfig);
    // prefs.set() escribe directamente al archivo
    prefs.set('user', newConfig);
}

module.exports = {
    getServer,
    getUser,
    setServer,
    setUser
};