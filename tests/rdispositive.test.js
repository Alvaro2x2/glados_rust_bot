const handleDeviceControl = require('../functions/rdispositive');

// NodePrefs mock
jest.mock('node-prefs', () => {
  return jest.fn().mockImplementation(() => ({
    has: jest.fn().mockImplementation(key => key === 'testDevice'),
    get: jest.fn().mockReturnValue('123456')
  }));
});

describe('Device Control Module', () => {
  let mockRustplus;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // RustPlus object mock
    mockRustplus = {
      isConnected: jest.fn().mockReturnValue(true),
      connect: jest.fn(),
      turnSmartSwitchOn: jest.fn(),
      turnSmartSwitchOff: jest.fn(),
      sendTeamMessage: jest.fn()
    };
  });

  test('should handle on command correctly', () => {
    handleDeviceControl(mockRustplus, ':on testDevice', 'testUser');

    expect(mockRustplus.turnSmartSwitchOn).toHaveBeenCalledWith('123456', expect.any(Function));
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('testDevice has been activated by testUser')
    );
    // Verificar que no se intenta reconexión
    expect(mockRustplus.connect).not.toHaveBeenCalled();
  });

  test('should handle off command correctly', () => {
    handleDeviceControl(mockRustplus, ':off testDevice', 'testUser');

    expect(mockRustplus.turnSmartSwitchOff).toHaveBeenCalledWith('123456', expect.any(Function));
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('testDevice has been deactivated by testUser')
    );
    // Verificar que no se intenta reconexión
    expect(mockRustplus.connect).not.toHaveBeenCalled();
  });

  test('should handle non-existent device', () => {
    handleDeviceControl(mockRustplus, ':on nonexistentDevice', 'testUser');

    expect(mockRustplus.turnSmartSwitchOn).not.toHaveBeenCalled();
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Device \'nonexistentDevice\' not found')
    );
    // Verificar que no se intenta reconexión
    expect(mockRustplus.connect).not.toHaveBeenCalled();
  });

  test('should handle missing device name', () => {
    handleDeviceControl(mockRustplus, ':on', 'testUser');

    expect(mockRustplus.turnSmartSwitchOn).not.toHaveBeenCalled();
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Device \'undefined\' not found')
    );
    // Verificar que no se intenta reconexión
    expect(mockRustplus.connect).not.toHaveBeenCalled();
  });

  test('should not attempt reconnection after any command', () => {
    // Probar múltiples comandos
    handleDeviceControl(mockRustplus, ':on testDevice', 'testUser');
    handleDeviceControl(mockRustplus, ':off testDevice', 'testUser');
    handleDeviceControl(mockRustplus, ':on nonexistentDevice', 'testUser');

    // Verificar que nunca se intenta reconexión
    expect(mockRustplus.connect).not.toHaveBeenCalled();
  });
});