#!/usr/bin/env node

const axios = require('axios');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const ChromeLauncher = require('chrome-launcher');
const path = require('path');
const fs = require('fs');
const AndroidFCM = require('@liamcottle/push-receiver/src/android/fcm');
const PushReceiverClient = require("@liamcottle/push-receiver/src/client");
const NodePrefs = require('node-prefs');
const configSU = require('../config/config-su');
const prefs = new NodePrefs({fileName: "config-s.js"});
let server;
let fcmClient;

// Error handling function
function handleError(error, context) {
    console.error(`[${new Date().toISOString()}] Error in ${context}:`, error);
    // Log to file for debugging
    fs.appendFileSync('listener-error.log', 
        `[${new Date().toISOString()}] Error in ${context}: ${error.message}\n${error.stack}\n\n`);
}

/**
 * Get the path to the config file defined in command line options,
 * or fallback to default config file in current directory.
 */
function getConfigFile(options) {
    return options['config-file'] || path.join(process.cwd(), 'rustplus.config.json');
}

/**
 * Reads config file, or returns empty config on error
 */
function readConfig(configFile) {
    try {
        return JSON.parse(fs.readFileSync(configFile));
    } catch (err) {
        console.error(`Failed to read config file: ${err.message}`);
        return {};
    }
}

/**
 * Merges new config into existing config and saves to config file
 */
function updateConfig(configFile, config) {
    try {
        const currentConfig = readConfig(configFile);
        const updatedConfig = {...currentConfig, ...config};
        const json = JSON.stringify(updatedConfig, null, 2);
        fs.writeFileSync(configFile, json, "utf8");
        console.log(`Configuration successfully updated at: ${configFile}`);
    } catch (error) {
        handleError(error, 'updateConfig');
    }
}

async function getExpoPushToken(fcmToken) {
    try {
        console.log('Requesting Expo Push Token...');
        const response = await axios.post('https://exp.host/--/api/v2/push/getExpoPushToken', {
            type: 'fcm',
            deviceId: uuidv4(),
            development: false,
            appId: 'com.facepunch.rust.companion',
            deviceToken: fcmToken,
            projectId: "49451aca-a822-41e6-ad59-955718d0ff9c",
        });
        console.log('Expo Push Token received successfully');
        return response.data.data.expoPushToken;
    } catch (error) {
        handleError(error, 'getExpoPushToken');
        throw error;
    }
}

async function registerWithRustPlus(authToken, expoPushToken) {
    try {
        console.log('Registering with Rust Companion API...');
        const response = await axios.post('https://companion-rust.facepunch.com:443/api/push/register', {
            AuthToken: authToken,
            DeviceId: 'rustplus.js',
            PushKind: 3,
            PushToken: expoPushToken,
        });
        console.log('Registration with Rust Companion API successful');
        return response;
    } catch (error) {
        handleError(error, 'registerWithRustPlus');
        throw error;
    }
}

async function linkSteamWithRustPlus() {
    return new Promise((resolve, reject) => {
        const app = express();

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname + '/pair.html'));
        });

        app.get('/callback', async (req, res) => {
            try {
                await ChromeLauncher.killAll();
                const authToken = req.query.token;
                if (authToken) {
                    res.send('Steam Account successfully linked with rustplus.js, you can now close this window and go back to the console.');
                    resolve(authToken);
                } else {
                    throw new Error('Token missing from request!');
                }
            } catch (error) {
                handleError(error, 'callback');
                res.status(400).send('Error processing callback: ' + error.message);
                reject(error);
            } finally {
                if (server) {
                    server.close();
                }
            }
        });

        const port = 3000;
        server = app.listen(port, async () => {
            try {
                await ChromeLauncher.launch({
                    startingUrl: `http://localhost:${port}`,
                    chromeFlags: [
                        '--disable-web-security',
                        '--disable-popup-blocking',
                        '--disable-site-isolation-trials',
                        '--user-data-dir=/tmp/temporary-chrome-profile-dir-rustplus',
                    ],
                    handleSIGINT: false,
                });
                console.log('Chrome launched successfully');
            } catch (error) {
                handleError(error, 'ChromeLauncher');
                console.error("Failed to launch Google Chrome. Is it installed?");
                process.exit(1);
            }
        });

        server.on('error', (error) => {
            handleError(error, 'express server');
            reject(error);
        });
    });
}

async function fcmRegister(options) {
    try {
        console.log("Starting FCM registration");
        const apiKey = "AIzaSyB5y2y-Tzqb4-I4Qnlsh_9naYv_TD8pCvY";
        const projectId = "rust-companion-app";
        const gcmSenderId = "976529667804";
        const gmsAppId = "1:976529667804:android:d6f1ddeb4403b338fea619";
        const androidPackageName = "com.facepunch.rust.companion";
        const androidPackageCert = "E28D05345FB78A7A1A63D70F4A302DBF426CA5AD";
        
        console.log("Requesting FCM credentials...");
        const fcmCredentials = await AndroidFCM.register(
            apiKey, projectId, gcmSenderId, gmsAppId, 
            androidPackageName, androidPackageCert
        );
        console.log("FCM credentials received");

        const expoPushToken = await getExpoPushToken(fcmCredentials.fcm.token);
        console.log("Expo Push Token received:", expoPushToken);

        console.log("Launching Google Chrome for Steam account linking");
        const rustplusAuthToken = await linkSteamWithRustPlus();
        console.log("Rust+ Auth Token received:", rustplusAuthToken);

        await registerWithRustPlus(rustplusAuthToken, expoPushToken);

        const configFile = getConfigFile(options);
        updateConfig(configFile, {
            fcm_credentials: fcmCredentials,
            expo_push_token: expoPushToken,
            rustplus_auth_token: rustplusAuthToken,
        });
    } catch (error) {
        handleError(error, 'fcmRegister');
        process.exit(1);
    }
}

async function fcmListen(options) {
    try {
        const configFile = getConfigFile(options);
        const config = readConfig(configFile);

        if (!config.fcm_credentials) {
            console.error("FCM Credentials missing. Please run 'fcm-register' first.");
            process.exit(1);
        }

        console.log("Initializing FCM listener...");
        const androidId = config.fcm_credentials.gcm.androidId;
        const securityToken = config.fcm_credentials.gcm.securityToken;
        fcmClient = new PushReceiverClient(androidId, securityToken, []);

        fcmClient.on('connect', () => {
            console.log('Connected to FCM server');
        });

        fcmClient.on('disconnect', () => {
            console.log('Disconnected from FCM server');
        });

        fcmClient.on('error', (error) => {
            handleError(error, 'FCM client');
        });

        fcmClient.on('ON_DATA_RECEIVED', (data) => {
            try {
                const timestamp = new Date().toISOString();
                console.log('[32m%s[0m', `[${timestamp}] Notification received`);
                console.log(data);

                const bodyItem = data.appData.find((item) => item.key === 'body');
                if (bodyItem) {
                    // Clean up JSON formatting
                    let fixedJson = bodyItem.value;
                    
                    // Step 1: Replace "" between fields with commas
                    fixedJson = fixedJson.replace(/"{2}(?=[a-zA-Z])/g, '","');
                    
                    // Step 2: Ensure first field has correct quotes
                    fixedJson = fixedJson.replace(/^{""/, '{"');
                    
                    // Step 3: Replace double quotes around values
                    fixedJson = fixedJson.replace(/:\s*"([^"]+)"{2}/g, ':"$1"');
                    
                    console.log('Original JSON:', bodyItem.value);
                    console.log('Cleaned JSON:', fixedJson);
                    let bodyData;
                    try {
                        bodyData = JSON.parse(fixedJson);
                    } catch (jsonError) {
                        console.error('Error parsing JSON:', jsonError);
                        console.error('JSON that caused error:', fixedJson);
                        return;
                    }

                    // Handle server notifications
                    if (bodyData.type === 'server') {
                        console.log(`Processing server data - ID: ${bodyData.id}, Name: ${bodyData.name}`);
                        
                        // Update server configuration using config-su
                        configSU.setServer({
                            ip: bodyData.ip,
                            port: bodyData.port,
                            name: bodyData.name,
                            id: bodyData.id
                        });

                        // Update user configuration
                        configSU.setUser({
                            steamid: bodyData.playerId,
                            token: bodyData.playerToken
                        });

                        console.log('Server and player configuration updated successfully');
                    }
                    // Handle entity notifications
                    else if (bodyData.type === 'entity') {
                        prefs.clear();
                        console.log(`Processing entity data: ${bodyData.entityName} (${bodyData.entityId})`);
                        prefs.set(bodyData.entityId, bodyData.entityName);
                        console.log(`Entity ${bodyData.entityId} saved to preferences`);
                    }    
                    // Handle death notifications
                    else if (bodyData.type === 'death') {
                        console.log(`Death event: Killed by ${bodyData.targetName} (${bodyData.targetId})`);
                    }
                } else {
                    console.log('No body property found in appData');
                }
            } catch (error) {
                handleError(error, 'notification processing');
            }
        });

        await fcmClient.connect();
        console.log("FCM listener initialized and running");

    } catch (error) {
        handleError(error, 'fcmListen');
        process.exit(1);
    }
}

function showUsage() {
    const usage = commandLineUsage([
        {
            header: 'RustPlus',
            content: 'A command line tool for things related to Rust+',
        },
        {
            header: 'Usage',
            content: '$ rustplus <options> <command>'
        },
        {
            header: 'Command List',
            content: [
                { name: 'help', summary: 'Print this usage guide.' },
                { name: 'fcm-register', summary: 'Registers with FCM, Expo and links your Steam account with Rust+ so you can listen for Pairing Notifications.' },
                { name: 'fcm-listen', summary: 'Listens to notifications received from FCM, such as Rust+ Pairing Notifications.' },
            ]
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'config-file',
                    typeLabel: '{underline file}',
                    description: 'Path to config file. (default: rustplus.config.json)',
                },
            ],
        },
    ]);
    console.log(usage);
}

async function run() {
    try {
        const options = commandLineArgs([
            { name: 'command', type: String, defaultOption: true },
            { name: 'config-file', type: String },
        ]);

        switch(options.command) {
            case 'fcm-register':
                await fcmRegister(options);
                break;
            case 'fcm-listen':
                await fcmListen(options);
                break;
            case 'help':
                showUsage();
                break;
            default:
                showUsage();
                break;
        }
    } catch (error) {
        handleError(error, 'command processing');
        process.exit(1);
    }
}

async function shutdown() {
    console.log('Shutting down listener...');
    try {
        await ChromeLauncher.killAll();
        if (server) {
            server.close();
        }
        if (fcmClient) {
            fcmClient.destroy();
        }
        console.log('Shutdown complete');
    } catch (error) {
        handleError(error, 'shutdown');
    }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
    handleError(error, 'uncaught exception');
    shutdown().then(() => process.exit(1));
});
process.on('unhandledRejection', (error) => {
    handleError(error, 'unhandled rejection');
});

run().catch((error) => {
    handleError(error, 'main');
    process.exit(1);
});
