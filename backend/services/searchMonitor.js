const logger = require('../utils/logger');

class SearchMonitor {
  constructor() {
    this.metrics = {
      totalSearches: 0,
      searchesByEngine: {},
      searchesByType: {},
      totalResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errorCount: 0,
      zeroResultCount: 0,
      clickCount: 0,
      conversionCount: 0,
      bounceCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      esFailoverCount: 0,
      atlasFailoverCount: 0,
    };

    this.historicalMetrics = [];
    this.lastFlushTime = Date.now();
    this.flushInterval = parseInt(process.env.SEARCH_MONITOR_FLUSH_INTERVAL) || 60000;

    if (process.env.NODE_ENV !== 'test') {
      this._startFlushCycle();
    }
  }

  recordSearch({ engine, searchType, responseTimeMs, totalResults, error = false }) {
    this.metrics.totalSearches++;
    this.metrics.searchesByEngine[engine] = (this.metrics.searchesByEngine[engine] || 0) + 1;
    this.metrics.searchesByType[searchType] = (this.metrics.searchesByType[searchType] || 0) + 1;
    this.metrics.totalResponseTime += responseTimeMs || 0;
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTimeMs || 0);
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTimeMs || Infinity);

    if (error) this.metrics.errorCount++;
    if (totalResults === 0) this.metrics.zeroResultCount++;

    if (engine === 'elasticsearch_error' || (engine === 'regex_fallback' && this.metrics.totalSearches > 10)) {
      // Track when ES is failing over
    }
  }

  recordClick() {
    this.metrics.clickCount++;
  }

  recordConversion() {
    this.metrics.conversionCount++;
  }

  recordBounce() {
    this.metrics.bounceCount++;
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  recordEngineFailover(fromEngine, toEngine) {
    if (fromEngine === 'elasticsearch' || toEngine === 'elasticsearch') {
      this.metrics.esFailoverCount++;
    }
    if (fromEngine === 'atlas_search' || fromEngine === 'elasticsearch' && toEngine === 'text_index') {
      this.metrics.atlasFailoverCount++;
    }
    logger.warn(`Search engine failover: ${fromEngine} -> ${toEngine}`);
  }

  getMetrics() {
    const avgResponseTime = this.metrics.totalSearches > 0
      ? Math.round(this.metrics.totalResponseTime / this.metrics.totalSearches)
      : 0;

    const zeroResultRate = this.metrics.totalSearches > 0
      ? Math.round((this.metrics.zeroResultCount / this.metrics.totalSearches) * 10000) / 100
      : 0;

    const errorRate = this.metrics.totalSearches > 0
      ? Math.round((this.metrics.errorCount / this.metrics.totalSearches) * 10000) / 100
      : 0;

    const clickThroughRate = this.metrics.totalSearches > 0
      ? Math.round((this.metrics.clickCount / this.metrics.totalSearches) * 10000) / 100
      : 0;

    const conversionRate = this.metrics.totalSearches > 0
      ? Math.round((this.metrics.conversionCount / this.metrics.totalSearches) * 10000) / 100
      : 0;

    return {
      ...this.metrics,
      avgResponseTime,
      zeroResultRate,
      errorRate,
      clickThroughRate,
      conversionRate,
      minResponseTime: this.metrics.minResponseTime === Infinity ? 0 : this.metrics.minResponseTime,
      uptime: Date.now() - this.lastFlushTime,
    };
  }

  getEngineBreakdown() {
    return {
      engines: this.metrics.searchesByEngine,
      types: this.metrics.searchesByType,
      primaryEngine: Object.entries(this.metrics.searchesByEngine)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const warnings = [];
    const criticals = [];

    if (metrics.errorRate > 10) criticals.push(`Error rate ${metrics.errorRate}% exceeds 10% threshold`);
    else if (metrics.errorRate > 5) warnings.push(`Error rate ${metrics.errorRate}% exceeds 5% threshold`);

    if (metrics.avgResponseTime > 3000) criticals.push(`Avg response time ${metrics.avgResponseTime}ms exceeds 3s threshold`);
    else if (metrics.avgResponseTime > 1000) warnings.push(`Avg response time ${metrics.avgResponseTime}ms exceeds 1s threshold`);

    if (metrics.zeroResultRate > 40) warnings.push(`Zero-result rate ${metrics.zeroResultRate}% exceeds 40% threshold`);

    if (metrics.esFailoverCount > 10) warnings.push(`Elasticsearch failover count: ${metrics.esFailoverCount}`);
    if (metrics.atlasFailoverCount > 10) warnings.push(`Atlas Search failover count: ${metrics.atlasFailoverCount}`);

    const status = criticals.length > 0 ? 'critical' : warnings.length > 0 ? 'warning' : 'healthy';

    return { status, warnings, criticals, metrics };
  }

  resetMetrics() {
    this.historicalMetrics.push({
      timestamp: new Date(),
      metrics: { ...this.metrics },
    });

    const MAX_HISTORY = 100;
    if (this.historicalMetrics.length > MAX_HISTORY) {
      this.historicalMetrics = this.historicalMetrics.slice(-MAX_HISTORY);
    }

    this.metrics = {
      totalSearches: 0,
      searchesByEngine: {},
      searchesByType: {},
      totalResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errorCount: 0,
      zeroResultCount: 0,
      clickCount: 0,
      conversionCount: 0,
      bounceCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      esFailoverCount: 0,
      atlasFailoverCount: 0,
    };
  }

  getHistoricalMetrics(limit = 10) {
    return this.historicalMetrics.slice(-limit);
  }

  _startFlushCycle() {
    setInterval(() => {
      const metrics = this.getMetrics();
      if (metrics.totalSearches > 0) {
        logger.info(`Search monitor [${new Date().toISOString()}]: ${metrics.totalSearches} searches, avg ${metrics.avgResponseTime}ms, ${metrics.errorRate}% errors, ${metrics.zeroResultRate}% zero-result`);

        const health = this.getHealthStatus();
        if (health.status !== 'healthy') {
          logger.warn(`Search health: ${health.status}${health.warnings.length ? ' | warnings: ' + health.warnings.join(', ') : ''}${health.criticals.length ? ' | criticals: ' + health.criticals.join(', ') : ''}`);
        }

        this.resetMetrics();
      }
    }, this.flushInterval);
  }
}

module.exports = new SearchMonitor();
