# GLaDOS Rust Bot

A Rust bot that allows you to control devices and obtain server information through team chat using the Rust+ API.

## 🚀 Features

- Device control (on/off)
- Device information (status)
- Server information (time)
- Crafting cost calculations
- Search items in vending machines
- Note system
- Device management through FCM notifications
- Steam integration for authentication
- Automatic connection management with heartbeat system
- Automatic FCM registration and listener startup
- Smart configuration management and auto-reconnect

## 📋 Requirements

- Node.js
- npm
- Google Chrome (required for listener component)
- Steam account with Rust
- Rust+ app linked to your account

## 🔧 Installation

1. Clone the repository
2. Install main bot dependencies:
```bash
npm install
```
3. Install listener dependencies:
```bash
cd listener
npm install
```

## ⚙️ Configuration

The bot now handles configuration automatically:

1. Start the bot:
```bash
npm start
```

2. The bot will:
   - Check for existing configuration
   - If none exists, automatically start FCM registration
   - Launch Chrome for Steam linking if needed
   - Start the FCM listener automatically
   - Connect to the Rust server with the configured credentials

## 🎮 Usage

1. Start everything with a single command:
```bash
npm start
```

2. Use commands in the game's team chat prefixed with ':' 

### Available Commands

- `:on <device>` - Turn on a device (e.g. `:on lights`)
- `:off <device>` - Turn off a device (e.g. `:off turrets`)
- `:time` - Show current time and minutes until next sunrise/sunset
- `:status` - Display status of all connected smart devices
- `:note` - Note system commands:
  - `:note add <text>` - Add a new note
  - `:note list` - Show all notes
  - `:note remove <number>` - Delete note by index
  - `:note clear` - Delete all notes
- `:save <name>` - First on the smart switch select pair device, then use the command :save <name> to save the smart switch.
- `:clear` - Clear all dispositives (Temporary until an automatic function is created to remove non-existent devices.A)
- `:craftcost <item> <quantity>` - Calculate materials needed to craft items (e.g. `:craftcost c4 2`)
- `:search <item>` - Search for items in vending machines (e.g. `:search metal`)
- `:task` - Task management commands:
  - `:task search <item> <quantity> <currency> <maxPrice>` - Schedule recurring search for items in vending machines (e.g. `:task     search jackhammer 1 scrap 100`)
  - `:task status` - List all active tasks
  - `:task stop <id>` - Stop a specific task
  - `:task delete <id>` - Delete a specific task
- `:coinflip` - Flip a coin (returns heads or tails)
- `:help` - Show list of available commands

## 🚧 Project Status

**NOTE: Project under development - Not finished**

### Implemented Features
- Basic Rust+ API connection
- Chat command processing
- Basic device control
- Crafting cost calculation
- Search in existing vending machines
- Automated task system for item searches
- Basic note system
- FCM registration and listening
- Steam linking
- Stable connection management with heartbeat
- Improved error handling
- Automatic configuration and startup process
- Smart reconnection on config changes

### Pending
- Implement commands: `map`, `ecost`, `cargo`, `smallpetro`, `bigpetro`, `cupboard`
- Improve note system
- Expand listener functionalities
- Add comprehensive documentation
- Implement tests
- Add connection metrics system

## 🛠️ Technologies

- Node.js
- @liamcottle/rustplus.js
- Express
- node-prefs
- push-receiver
- axios
- chrome-launcher

## ⚠️ Limitations

- Bot capabilities are limited by Rust+ API functionality
- Real-time communication depends on Rust+ API and FCM
- Steam linking process requires Google Chrome
