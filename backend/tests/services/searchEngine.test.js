const { expect } = require('chai');

describe('Search Engine — Service (requires MongoDB)', () => {
  let searchEngine;

  before(function() {
    try {
      searchEngine = require('../../services/searchEngine');
    } catch (e) {
      this.skip();
    }
  });

  describe('autocomplete', () => {
    it('should return empty suggestions for short query', async () => {
      const result = await searchEngine.autocomplete('507f1f77bcf86cd799439011', 'a', {});
      expect(result.suggestions).to.be.an('array').that.is.empty;
    });

    it('should return empty suggestions for empty query', async () => {
      const result = await searchEngine.autocomplete('507f1f77bcf86cd799439011', '', {});
      expect(result.suggestions).to.be.an('array').that.is.empty;
    });
  });

  describe('search', () => {
    it('should return empty results for empty query without filters', async () => {
      const result = await searchEngine.search('507f1f77bcf86cd799439011', '', { page: 1, limit: 20 });
      expect(result.results).to.be.an('array');
      expect(result.total).to.equal(0);
    });
  });

  describe.skip('barcodeSearch', () => {
    it('requires MongoDB connection', async () => {
      const result = await searchEngine.barcodeSearch('507f1f77bcf86cd799439011', 'NONEXISTENT');
      expect(result).to.be.null;
    });
  });

  describe('imageSearch', () => {
    it('should return message when AI endpoint is not configured', async () => {
      const result = await searchEngine.imageSearch('507f1f77bcf86cd799439011', 'https://example.com/img.jpg');
      expect(result.message).to.include('requires AI_MODEL_ENDPOINT');
    });
  });
});

describe('Search Optimizer Middleware (unit)', () => {
  const searchOptimizer = require('../../middleware/searchOptimizer');

  it('should normalize and lowercase query string', () => {
    const req = { query: { q: '  Hello   World!  ' }, searchOptimized: null };
    let nextCalled = false;
    searchOptimizer(req, {}, () => { nextCalled = true; });
    expect(req.searchOptimized.normalized).to.equal('hello world');
    expect(nextCalled).to.be.true;
  });

  it('should detect language from query', () => {
    const req = { query: { q: 'bonjour merci produit' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.language).to.equal('fr');
  });

  it('should detect price intent (max)', () => {
    const req = { query: { q: 'laptop under 500000' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.price).to.deep.include({ max: 500000 });
  });

  it('should detect sort intent', () => {
    const req = { query: { q: 'cheapest phone' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.sort).to.equal('price_asc');
  });

  it('should detect category intent', () => {
    const req = { query: { q: 'buy shoes online' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.category).to.equal('clothing');
  });

  it('should handle empty query', () => {
    const req = { query: { q: '' }, searchOptimized: null };
    let nextCalled = false;
    searchOptimizer(req, {}, () => { nextCalled = true; });
    expect(req.searchOptimized.original).to.equal('');
    expect(nextCalled).to.be.true;
  });

  it('should expand acronyms', () => {
    const req = { query: { q: 'tv' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.normalized).to.equal('television');
  });

  it('should extract bestseller sort intent', () => {
    const req = { query: { q: 'trending phones' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.sort).to.equal('bestseller');
  });

  it('should detect Swahili language', () => {
    const req = { query: { q: 'bei ya bidhaa' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.language).to.equal('sw');
  });

  it('should detect price range intent', () => {
    const req = { query: { q: 'laptop 300000 to 500000' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.price).to.deep.include({ min: 300000, max: 500000 });
  });

  it('should filter stop words', () => {
    const req = { query: { q: 'the a an cheap laptop' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.meaningful).to.deep.equal(['cheap', 'laptop', 'computer']);
  });

  it('should detect more than sort from query', () => {
    const req = { query: { q: 'most expensive laptop' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.sort).to.equal('price_desc');
  });

  it('should detect newest sort intent', () => {
    const req = { query: { q: 'latest phones' }, searchOptimized: null };
    searchOptimizer(req, {}, () => {});
    expect(req.searchOptimized.filters.sort).to.equal('newest');
  });
});
