console.log('Initializing GLaDOS');

const config = require('./config/config');
const configSU = require('./config/config-su');
const RustPlus = require('@liamcottle/rustplus.js');
const NodePrefs = require('node-prefs');
const { spawn } = require('child_process');
const path = require('path');

// Command handlers
const timeHandler = require('./functions/rtime');
const cargoHandler = require('./functions/rcargo');
const statusHandler = require('./functions/rstatus');
const craftCostHandler = require('./functions/rcraftcost');
const deviceHandler = require('./functions/rdispositive');
const noteHandler = require('./functions/rnote');
const rsearchHandler = require('./functions/rsearch'); 
const rmapsize = require('./functions/rmapsize'); 
const rpositionHandler = require('./functions/rposition');

// Command constants
const COMMANDS = {
    ON: 'on',
    OFF: 'off',
    TIME: 'time',
    STATUS: 'status',
    MAP: 'map',
    SAVE: 'save',
    CLEAR: 'clear',
    NOTE: 'note',
    CRAFTCOST: 'craftcost',
    COINFLIP: 'coinflip',
    ECOST: 'ecost',
    HELP: 'help',
    SEARCH: 'search',
    TASK: 'task'
};

// Initialize device preferences
const devicePrefs = new NodePrefs({fileName: "config-dis.js"});

// Error handling function
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    // Solo intentar enviar mensaje si rustplus existe y está conectado
    try {
        if (typeof rustplus !== 'undefined' && rustplus && rustplus.isConnected()) {
            rustplus.sendTeamMessage(`GLaDOS Error: ${context} - ${error.message}`);
        }
    } catch (e) {
        // Ignora errores al intentar enviar mensaje
        console.error('Could not send error message to team chat:', e.message);
    }
}

// Heartbeat to keep connection alive
let heartbeatTimer = null;

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

function startHeartbeat(rustplus) {
    // Detiene cualquier heartbeat previo antes de iniciar uno nuevo
    stopHeartbeat();
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
     
    heartbeatTimer = setInterval(() => {
        try {
            if (rustplus && rustplus.isConnected()) {
                rustplus.getInfo((message) => {
                    if (message && message.response && message.response.info) {
                        console.log('Heartbeat: connection OK');
                    } else {
                        console.log('Heartbeat: invalid response');
                    }
                });
            }
        } catch (error) {
            console.error('Heartbeat error:', error.message);
        }
    }, HEARTBEAT_INTERVAL);
}

// Start Rust+ Listener
function startListener() {
    console.log('Starting Rust+ Listener...');
    const listenerPath = path.join(__dirname, 'listener', 'index.js');
    const listener = spawn('node', [listenerPath, 'fcm-listen'], {
        stdio: 'inherit'
    });

    listener.on('error', (error) => {
        handleError(error, 'listener spawn');
    });

    return listener;
}

// Start registration process if needed
function startRegistration() {
    console.log('Starting registration process...');
    const listenerPath = path.join(__dirname, 'listener', 'index.js');
    const registration = spawn('node', [listenerPath, 'fcm-register'], {
        stdio: 'inherit'
    });

    registration.on('error', (error) => {
        handleError(error, 'registration spawn');
    });

    return registration;
}

// Initialize Rust+ connection
async function initializeRustPlus() {
    let rustplus;
    try {
        const serverConfig = configSU.getServer();
        const userConfig = configSU.getUser();
        
        console.log('Initializing RustPlus connection...');
        rustplus = new RustPlus(
            serverConfig.ip, 
            serverConfig.port, 
            userConfig.steamid, 
            userConfig.token
        );

        // Connection event handlers
        rustplus.on('connecting', () => {
            console.log('Connecting to Rust server...');
        });

        rustplus.on('connected', () => {
            console.log('Connected to Rust server');
            console.log('Requesting server info...');
            
            // Get server info with retry mechanism
            function getServerInfo(retryCount = 0) {
                rustplus.getInfo((message) => {
                    try {
                        console.log(message);
                        if (!message || !message.response || !message.response.info) {
                            console.log('Invalid server info received');
                            if (retryCount < 3) {
                                console.log(`Retrying in 5 seconds... (attempt ${retryCount + 1}/3)`);
                                setTimeout(() => getServerInfo(retryCount + 1), 5000);
                            } else {
                                console.error('Failed to get server info after 3 attempts');
                            }
                            return;
                        }

                        console.log('Server info received:', message.response.info);
                        rmapsize.mapsize(message);
                        
                        // Initialize or update taskManager
                        if (!global.taskManager) {
                            const RTask = require('./functions/rtask');
                            global.taskManager = new RTask(rustplus);
                            console.log('Task manager initialized');
                        } else {
                            global.taskManager.rustplus = rustplus;
                            console.log('Task manager updated with new rustplus instance');
                        }

                        // Start heartbeat after successful connection
                        startHeartbeat(rustplus);

                    } catch (error) {
                        handleError(error, 'getServerInfo');
                        if (retryCount < 3) {
                            console.log(`Retrying in 5 seconds... (attempt ${retryCount + 1}/3)`);
                            setTimeout(() => getServerInfo(retryCount + 1), 5000);
                        }
                    }
                });
            }

            getServerInfo();
        });

        rustplus.on('disconnected', () => {
            console.log('Disconnected from Rust server');
            // Try to reconnect once after 5 seconds
            setTimeout(() => {
                if (!rustplus.isConnected()) {
                    console.log('Attempting simple reconnection...');
                    rustplus.connect();
                }
            }, 5000);
        });

        rustplus.on('error', (error) => {
            handleError(error, 'RustPlus connection');
        });

        // Event handler for entity changes
        rustplus.on('message', (message) => {
            try {
                // Handle entity state changes
                if(message.broadcast && message.broadcast.entityChanged) {
                    const entityChanged = message.broadcast.entityChanged;
                    console.log('Entity change broadcast received:', message.broadcast);

                    const entityId = entityChanged.entityId;
                    const value = entityChanged.payload.value;
                    console.log(`Entity ${entityId} is now ${value ? "active" : "inactive"}`);
                }

                // Handle team messages
                if(message.broadcast && message.broadcast.teamMessage) {
                    const teamMessage = message.broadcast.teamMessage.message.message;
                    const sender = message.broadcast.teamMessage.message.name;
                    const senderId = message.broadcast.teamMessage.message.steamId;

                    // Process commands (messages starting with ':')
                    if (teamMessage.startsWith(':')) {
                        console.log(`Processing command: ${teamMessage} from ${sender}`);
                        const command = teamMessage.split(":")[1].split(" ")[0];

                        switch(command) {
                            case COMMANDS.OFF:
                            case COMMANDS.ON:
                                deviceHandler(rustplus, teamMessage, sender);
                                break;
                            case COMMANDS.TIME:
                                timeHandler(rustplus, sender);
                                break;
                            case COMMANDS.STATUS:
                                statusHandler(rustplus, sender);
                                break;
                            case COMMANDS.MAP:
                                rustplus.sendTeamMessage("GLaDOS: This feature is not available yet");
                                break;
                            case COMMANDS.SAVE:
                                try {
                                    const listener = new NodePrefs({fileName: "config-s.js"});
                                    console.log('Current listener keys:', listener.keys());
                                    const deviceName = teamMessage.split(' ')[1];
                                    if (deviceName === undefined) {
                                        rustplus.sendTeamMessage("GLaDOS: Device name required, the command is: :save NAME.");
                                        break;
                                    }
                                    rustplus.sendTeamMessage(`GLaDOS: Saving ${deviceName} with id ${listener.keys()[0]}`);
                                    devicePrefs.set(deviceName, listener.keys()[0]);
                                } catch (error) {
                                    handleError(error, 'save command');
                                }
                                break;
                            case COMMANDS.CLEAR:
                                const userConfig = configSU.getUser();
                                if(senderId == userConfig.steamid) {
                                    devicePrefs.clear();
                                    rustplus.sendTeamMessage("GLaDOS: All devices cleared");
                                }
                                break;
                            case COMMANDS.NOTE:
                                noteHandler.saveToFile(teamMessage.replace(':note',""));
                                rustplus.sendTeamMessage("GLaDOS: Note saved (read functionality coming soon)");
                                break;
                            case COMMANDS.CRAFTCOST:
                                craftCostHandler.handleCraftCost(rustplus, sender, teamMessage);
                                break;
                            case COMMANDS.COINFLIP:
                                const results = ["Loss", "Win"];
                                rustplus.sendTeamMessage(`GLaDOS: ${results[Math.floor(Math.random() * results.length)]}`);
                                break;
                            case COMMANDS.ECOST:
                                rustplus.sendTeamMessage("GLaDOS: This feature is not available yet");
                                break;
                            case COMMANDS.HELP:
                                rustplus.sendTeamMessage("GLaDOS: Available commands: :off/on DEVICE_NAME, :time, :status, :map, :save DEVICE_NAME, :note, :coinflip, :craftcost ITEM QUANTITY, :ecost ITEM, :rsearch ITEMNAME");
                                break;
case COMMANDS.SEARCH:
                                const itemName = teamMessage.split(' ')[1];
                                if (itemName === undefined) {
                                    rustplus.sendTeamMessage("GLaDOS: Item name required, the command is: :rsearch ITEMNAME.");
                                    break;
                                }
                                rsearchHandler.rsearch(rustplus, sender, itemName);
                                break;
                            case COMMANDS.TASK:
                                {
                                    // Initialize taskManager if not exists
                                    if (!global.taskManager) {
                                        const RTask = require('./functions/rtask');
                                        global.taskManager = new RTask(rustplus);
                                    } else {
                                        // Update rustplus instance in existing taskManager
                                        global.taskManager.rustplus = rustplus;
                                    }

                                    const args = teamMessage.split(' ').slice(1);
                                    if (args.length > 0) {
                                        const subCommand = args[0];
                                        switch(subCommand) {
                                            case 'search':
                                                rustplus.sendTeamMessage(global.taskManager.createTask(args.join(' '), rustplus));
                                                break;
                                            case 'status':
                                                rustplus.sendTeamMessage(global.taskManager.getStatus());
                                                break;
                                            case 'stop':
                                                rustplus.sendTeamMessage(global.taskManager.stopTask(args[1] || ""));
                                                break;
                                            case 'delete':
                                                rustplus.sendTeamMessage(global.taskManager.deleteTask(args[1] || ""));
                                                break;
                                            default:
                                                rustplus.sendTeamMessage("GLaDOS: Unknown task subcommand. Available: search, status, stop, delete");
                                        }
                                    } else {
                                        rustplus.sendTeamMessage("GLaDOS: No task subcommand provided");
                                    }
                                }
                                break;
                            default:
                                rustplus.sendTeamMessage(`GLaDOS: '${command}' is not a recognized command. Use :help to see available commands`);
                                break;
                        }
                    }
                }
            } catch (error) {
                handleError(error, 'message processing');
            }
        });

        return rustplus;
    } catch (error) {
        handleError(error, 'initialization');
        return null;
    }
}

// Function to check for configuration changes
function watchConfig(currentConfig, onConfigChanged) {
    const CHECK_INTERVAL = 15000; // 15 seconds
    let lastServerConfig = null;
    let lastUserConfig = null;
    let isFirstConfig = true;

    setInterval(() => {
        try {
            delete require.cache[require.resolve('./config/config-su')];
            let configSU2 = require('./config/config-su');
            let serverConfig = null;
            let userConfig = null;
            
            try {
                serverConfig = configSU2.getServer();
                userConfig = configSU2.getUser();
            } catch (error) {
                // Configuración aún no disponible del listener
                return;
            }

            const newServerConfig = JSON.stringify(serverConfig);
            const newUserConfig = JSON.stringify(userConfig);
            // Si es la primera configuración válida, actualizar y notificar
            if (isFirstConfig && serverConfig && userConfig) {
                console.log('Initial configuration received from listener');
                lastServerConfig = newServerConfig;
                lastUserConfig = newUserConfig;
                currentConfig.server = serverConfig;
                currentConfig.user = userConfig;
                isFirstConfig = false;
                onConfigChanged();
                return;
            }

            // Verificar cambios en configuraciones posteriores
            if (!isFirstConfig && (newServerConfig !== lastServerConfig || newUserConfig !== lastUserConfig)) {
                console.log('Configuration change detected');
                lastServerConfig = newServerConfig;
                lastUserConfig = newUserConfig;
                currentConfig.server = serverConfig;
                currentConfig.user = userConfig;
                onConfigChanged();
            }
        } catch (error) {
            console.log('Error checking configuration:', error.message);
        }
    }, CHECK_INTERVAL);
}

// Main function that handles the entire lifecycle
async function main() {
    let rustplus = null;
    let listener = null;

    try {
        const fs = require('fs');
        
        // Initialize configuration to null
        let currentConfig = {
            server: null,
            user: null
        };

        // Check and handle FCM registration first
        const configPath = path.join(process.cwd(), 'rustplus.config.json');
        if (!fs.existsSync(configPath)) {
            console.log('No FCM configuration found, starting registration process');
            const registration = startRegistration();
            await new Promise((resolve) => registration.on('exit', resolve));
        }

        // Start the listener which will provide server configuration
        listener = startListener();

        // Wait for initial configuration from listener
        console.log('Waiting for listener to provide initial configuration...');

        // Watch for configuration changes - this will also handle the initial connection
        watchConfig(currentConfig, async () => {
            try {
                if (rustplus) {
                    console.log('Disconnecting existing connection...');
                    rustplus.disconnect();
                }
                console.log('Initializing RustPlus with new configuration...');
                rustplus = await initializeRustPlus();
                if (rustplus) {
                    console.log('Connecting to server...');
                    rustplus.connect();
                }
            } catch (error) {
                handleError(error, 'connection management');
            }
        });

    } catch (error) {
        handleError(error, 'main');
    }
}

// Process handling
process.on('uncaughtException', (error) => {
    handleError(error, 'uncaught exception');
});

process.on('unhandledRejection', (error) => {
    handleError(error, 'unhandled rejection');
});

process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});

// Start everything
main();
