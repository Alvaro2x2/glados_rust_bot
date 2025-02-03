const handleDeviceStatus = require('../functions/rstatus');

// NodePrefs mock
jest.mock('node-prefs', () => {
  return jest.fn().mockImplementation(() => ({
    entries: jest.fn().mockReturnValue([
      ['Smart Switch 1', '123456'],
      ['Smart Switch 2', '789012']
    ])
  }));
});

describe('Device Status Module', () => {
  let mockRustplus;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // RustPlus object mock
    mockRustplus = {
      isConnected: jest.fn(),
      connect: jest.fn(),
      once: jest.fn(),
      getEntityInfo: jest.fn(),
      sendTeamMessage: jest.fn()
    };
  });

  test('should handle connected state correctly', async () => {
    // Simulate already connected state
    mockRustplus.isConnected.mockReturnValue(true);
    mockRustplus.getEntityInfo.mockImplementation((id, callback) => {
      callback({ response: { entityInfo: { payload: { value: true } } } });
    });

    await handleDeviceStatus(mockRustplus, 'testUser');

    expect(mockRustplus.isConnected).toHaveBeenCalled();
    expect(mockRustplus.connect).not.toHaveBeenCalled();
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledTimes(2);
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Status of Smart Switch 1 is active')
    );
  });

  test('should handle disconnected state correctly', async () => {
    // Simulate initial disconnection and subsequent connection
    mockRustplus.isConnected.mockReturnValue(false);
    mockRustplus.once.mockImplementation((event, callback) => callback());
    mockRustplus.getEntityInfo.mockImplementation((id, callback) => {
      callback({ response: { entityInfo: { payload: { value: false } } } });
    });

    await handleDeviceStatus(mockRustplus, 'testUser');

    expect(mockRustplus.isConnected).toHaveBeenCalled();
    expect(mockRustplus.connect).toHaveBeenCalled();
    expect(mockRustplus.once).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Status of Smart Switch 1 is inactive')
    );
  });

  test('should handle entity info error correctly', async () => {
    mockRustplus.isConnected.mockReturnValue(true);
    mockRustplus.getEntityInfo.mockImplementation((id, callback) => {
      throw new Error('Entity info error');
    });

    await handleDeviceStatus(mockRustplus, 'testUser');

    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Error getting status of Smart Switch 1')
    );
  });

  test('should handle connection error correctly', async () => {
    mockRustplus.isConnected.mockReturnValue(false);
    mockRustplus.once.mockImplementation((event, callback) => {
      throw new Error('Connection error');
    });

    await handleDeviceStatus(mockRustplus, 'testUser');

    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Connection error while checking status')
    );
  });

  test('should process all devices in config', async () => {
    mockRustplus.isConnected.mockReturnValue(true);
    mockRustplus.getEntityInfo.mockImplementation((id, callback) => {
      callback({ response: { entityInfo: { payload: { value: true } } } });
    });

    await handleDeviceStatus(mockRustplus, 'testUser');

    // Verify that both devices were processed
    expect(mockRustplus.getEntityInfo).toHaveBeenCalledTimes(2);
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledTimes(2);
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Smart Switch 1')
    );
    expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
      expect.stringContaining('Smart Switch 2')
    );
  });
});