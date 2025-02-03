# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-01

### Added
- Automatic startup system with single `npm start` command
- Automatic detection of existing configuration
- Automatic FCM registration process when needed
- Automatic FCM listener launch
- Smart configuration management system with 5-second polling
- Automatic reconnection when configuration changes
- Heartbeat system to keep connection active
- Basic team chat commands:
  - Device control (on/off)
  - Server time information
  - Device status
  - Note system
  - Crafting cost calculator
  - Shop search
  - Coinflip
- Steam integration for authentication
- Device management through FCM notifications
- Improved error handling and detailed logging

### Changed
- Simplified configuration process
- Improved reconnection system
- Project structure reorganized for better maintainability

### Fixed
- Unnecessary reconnection bug in on/off commands
- Connection stability issues
- Error handling in FCM notification processing
- JSON parsing issues in server messages

### Security
- Improved server configuration validation
- Secure handling of user credentials
- Command validation and user permissions

### Technical
- Heartbeat system implementation
- Improved child process handling
- Configuration change detection polling system
- Detailed diagnostic logging