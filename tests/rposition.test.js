const { getGrid } = require('../functions/rposition');

describe('getGrid', () => {
  test('should return "A2" for getGrid(50, 50, 438.75)', () => {
    // 438.75 is an exact multiple of gridDiameter (146.25*3)
    expect(getGrid(50, 50, 438.75)).toBe("A2");
  });

  test('should return "A2" when x is exactly on the boundary (146.25, 50, 438.75)', () => {
    // x at the end of the first grid
    expect(getGrid(146.25, 50, 438.75)).toBe("A2");
  });

  test('should return "B2" for getGrid(200, 50, 438.75)', () => {
    // x=200 falls into the second grid; y in the first row
    expect(getGrid(200, 50, 438.75)).toBe("B2");
  });

  test('should return "B0" for getGrid(200, 300, 500)', () => {
    // With mapSize 500, corrected map size becomes 438.75,
    // so x=200 is in second grid ("B") and y=300 falls into the last row (3-3=0)
    expect(getGrid(200, 300, 500)).toBe("B0");
  });

  test('should return "A3" for getGrid(50, 50, 580)', () => {
    // For mapSize 580, corrected map size becomes 580 + (146.25 - 141.25) = 585,
    // Number of grids = floor(585 / 146.25) = 4, so y=50 returns row 4-1=3
    expect(getGrid(50, 50, 580)).toBe("A3");
  });
});
