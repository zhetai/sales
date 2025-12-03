import { vi } from 'vitest';

// Setup global mocks
global.fetch = vi.fn();

// Mock crypto using Object.defineProperty
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
    getRandomValues: vi.fn((array) => {
      // Use cryptographically secure values for testing
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(array.length);
      for (let i = 0; i < array.length; i++) {
        array[i] = bytes[i];
      }
      return array;
    }),
    subtle: {
      importKey: vi.fn().mockResolvedValue('mock-key'),
      sign: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5])),
      verify: vi.fn().mockResolvedValue(true),
    },
  },
  writable: true,
  configurable: true
});

// Don't mock console globally as it interferes with spyOn in tests
// Individual tests will mock console as needed