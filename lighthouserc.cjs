module.exports = {
  ci: {
    collect: {
      staticDistDir: '.output/public',
      url: ['http://localhost/researchhub/index.html'],
      // Assertions check the median run — single runs on shared CI VMs
      // swing ±15 performance points from load noise alone.
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],

        // robots.txt deliberately blocks preview builds, which caps the SEO
        // category via its is-crawlable audit. Phase 4 flips robots at launch;
        // restore `'categories:seo': ['error', { minScore: 0.9 }]` then.
        // Until that, assert the SEO audits we control individually:
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'link-text': 'error',
        'crawlable-anchors': 'error',
      },
    },
  },
}
