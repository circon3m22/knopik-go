Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues(array) { array[0] = 17; return array; } } });
