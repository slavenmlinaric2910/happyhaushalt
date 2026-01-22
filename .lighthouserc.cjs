module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/household'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3, // Average 3 runs for stability
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu',
        // Skip authentication for now - we'll handle this
        skipAudits: ['uses-http2'],
      },
    },
    assert: {
      // Set baseline thresholds (will be updated after first run)
      assertions: {
        'categories:performance': ['warn', { minScore: 0.5 }], // Baseline: 55
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 12000 }], // Baseline: 11.7s
        'largest-contentful-paint': ['warn', { maxNumericValue: 26000 }], // Baseline: 25.4s
      },
    },
    upload: {
      target: 'temporary-public-storage', // Free, no setup needed
    },
  },
};

