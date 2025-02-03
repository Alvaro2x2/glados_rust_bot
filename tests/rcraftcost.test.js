const { handleCraftCost, calculateItemCost } = require('../functions/rcraftcost');
const config = require('../config/config');

// RustPlus mock
const mockRustplus = {
  sendTeamMessage: jest.fn(),
  connect: jest.fn()
};

// Configuration module mock
jest.mock('../config/config', () => ({
  craftCost: {
    rocket: {
      gunpowder: 150,
      explosive: 10
    },
    explosive: {
      sulfur: 10,
      gunpowder: 50
    },
    gunpowder: {
      sulfur: 2
    },
    c4: {
      explosive: 20,
      techtrash: 2
    },
    satchel: {
      gunpowder: 240
    },
    explosiveammo: {
      gunpowder: 10,
      sulfur: 5,
      lowgrade: 20
    },
    highvelocityrocket: {
      gunpowder: 100
    }
  }
}));

describe('Craft Cost Module', () => {
  beforeEach(() => {
    // Clear mock after each test
    jest.clearAllMocks();
  });

  describe('handleCraftCost', () => {
    test('should list available items when no parameters provided', () => {
      handleCraftCost(mockRustplus, 'sender', ':craftcost');
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining('Available items')
      );
    });

    test('should calculate costs when valid parameters are provided', () => {
      handleCraftCost(mockRustplus, 'sender', ':craftcost rocket 2');
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining('Rocket crafting costs:')
      );
    });
  });

  describe('calculateItemCost', () => {
    test('should calculate rocket costs correctly', () => {
      calculateItemCost(mockRustplus, 'sender', 'rocket', 1);
      
      const expectedGunpowder = 150 + (10 * 50); // Rocket gunpowder + (Explosivos * gunpowder per explosive)
      const expectedSulfurFromGunpowder = expectedGunpowder * 2; // Total gunpowder * sulfur per gunpowder
      const expectedSulfurFromExplosives = 10 * 10; // Explosivos * sulfur per explosive
      
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining(`Total gunpowder needed: ${expectedGunpowder}`)
      );
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining(`Total sulfur required: ${expectedSulfurFromGunpowder + expectedSulfurFromExplosives}`)
      );
    });

    test('should calculate C4 costs correctly', () => {
      calculateItemCost(mockRustplus, 'sender', 'c4', 1);
      
      const explosiveGunpowder = 20 * 50; // C4 explosives * gunpowder per explosive
      const explosiveSulfur = 20 * 10; // C4 explosives * sulfur per explosive
      const gunpowderSulfurCost = explosiveGunpowder * 2; // Total gunpowder * sulfur per gunpowder
      
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining(`Total gunpowder needed: ${explosiveGunpowder}`)
      );
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining(`Total sulfur required: ${gunpowderSulfurCost + explosiveSulfur}`)
      );
    });

    test('should calculate satchel costs correctly', () => {
      calculateItemCost(mockRustplus, 'sender', 'satchel', 1);
      
      const expectedGunpowder = 240;
      const expectedSulfur = expectedGunpowder * 2;
      
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining(`Total gunpowder needed: ${expectedGunpowder}`)
      );
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining(`Total sulfur required: ${expectedSulfur}`)
      );
    });

    test('should handle unknown items', () => {
      calculateItemCost(mockRustplus, 'sender', 'invalid_item', 1);
      expect(mockRustplus.sendTeamMessage).toHaveBeenCalledWith(
        expect.stringContaining('Unknown explosive item')
      );
    });
  });
});