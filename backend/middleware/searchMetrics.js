const searchMonitor = require('../services/searchMonitor');

function searchMetrics(req, res, next) {
  const startTime = Date.now();
  const originalQuery = req.query.q || req.body?.q || req.body?.transcript || '';

  res.on('finish', () => {
    if (!req.path.includes('/search') && !req.path.includes('/ai/search')) return;

    const responseTimeMs = Date.now() - startTime;
    const totalResults = res.locals?.searchResults?.total ?? res.locals?.searchResults?.length ?? 0;
    const engine = res.locals?.searchEngine || 'unknown';
    const searchType = req.path.includes('voice') ? 'voice'
      : req.path.includes('image') ? 'image'
      : req.path.includes('barcode') ? 'barcode'
      : req.path.includes('semantic') ? 'semantic'
      : req.path.includes('autocomplete') ? 'autocomplete'
      : 'text';

    const isError = res.statusCode >= 400;

    searchMonitor.recordSearch({
      engine,
      searchType,
      responseTimeMs,
      totalResults,
      error: isError,
      query: originalQuery,
    });
  });

  next();
}

function trackSearchResults(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body?.success && body?.data) {
      if (body.data.products) {
        res.locals.searchResults = body.data.products;
        res.locals.searchEngine = body.data.meta?.engine;
      }
      if (body.data.product) {
        res.locals.searchResults = [body.data.product];
      }
      if (body.data.trending) {
        res.locals.searchResults = body.data.trending;
      }
    }
    return originalJson(body);
  };
  next();
}

module.exports = { searchMetrics, trackSearchResults };
