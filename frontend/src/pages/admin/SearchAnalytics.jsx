import { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, MousePointerClick, Ban, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { searchAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

export default function SearchAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [popular, setPopular] = useState([]);
  const [zeroResult, setZeroResult] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      searchAPI.getAnalytics({ groupBy: 'day' }),
      searchAPI.getHistory({ limit: 5 }),
    ])
      .then(([analyticsRes]) => {
        setAnalytics(analyticsRes.data.data);
        setPopular(analyticsRes.data.data.popularSearches || []);
        setZeroResult(analyticsRes.data.data.zeroResultQueries || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchHealth = async () => {
    try {
      const { data } = await searchAPI.getHealth();
      setHealth(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    fetchHealth();
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await searchAPI.reindex();
    } catch {}
    setReindexing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const summary = analytics?.summary || {};
  const searchMetrics = [
    { icon: Search, label: 'Total Searches', value: summary.totalSearches ?? 0, color: 'text-blue-600 bg-blue-50' },
    { icon: MousePointerClick, label: 'Total Clicks', value: summary.totalClicks ?? 0, color: 'text-green-600 bg-green-50' },
    { icon: TrendingUp, label: 'Conversions', value: summary.totalConversions ?? 0, color: 'text-purple-600 bg-purple-50' },
    { icon: Clock, label: 'Avg Response', value: summary.avgResponseTime ? `${Math.round(summary.avgResponseTime)}ms` : '0ms', color: 'text-amber-600 bg-amber-50' },
  ];

  const healthStatus = health?.health?.status || 'unknown';
  const healthColor = healthStatus === 'healthy' ? 'success' : healthStatus === 'warning' ? 'warning' : 'danger';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Search Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Search & Discovery Engine performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <Badge variant={healthColor}>
              Engine: {healthStatus}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReindex} disabled={reindexing}>
            {reindexing ? 'Reindexing...' : 'Reindex'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {searchMetrics.map((metric) => (
          <Card key={metric.label} hover={false}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${metric.color}`}>
                <metric.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{metric.label}</p>
                <p className="text-xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {health && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Engine Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <Badge variant={healthColor} className="mt-1">{health.health.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500">Elasticsearch</p>
              <p className="font-medium mt-1">{health.elasticsearch?.connected ? 'Connected' : 'Not connected'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Primary Engine</p>
              <p className="font-medium mt-1">{health.engineBreakdown?.primaryEngine || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Error Rate</p>
              <p className="font-medium mt-1">{health.health.metrics?.errorRate || 0}%</p>
            </div>
          </div>
          {health.health.warnings?.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Warnings
              </p>
              <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                {health.health.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {health.health.criticals?.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                <Ban className="h-4 w-4" /> Critical
              </p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {health.health.criticals.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Searches</h2>
          {popular.length > 0 ? (
            <div className="space-y-2">
              {popular.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-sm text-gray-700">{item._id || item.query}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.count || item.searchCount || 0} searches</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title="No data yet" message="Popular searches will appear once users start searching" />
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zero-Result Queries</h2>
          {zeroResult.length > 0 ? (
            <div className="space-y-2">
              {zeroResult.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-sm text-gray-700">{item._id || item.query}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.count || item.searchCount || 0} times</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Search} title="No zero-result queries" message="All searches are returning results" />
          )}
        </Card>
      </div>

      {analytics?.analytics?.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Search Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Searches</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Clicks</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Conversions</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">CTR</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.analytics.map((day, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-900">{new Date(day._id || day.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-right">{day.totalSearches || 0}</td>
                    <td className="py-2 px-3 text-right">{day.totalClicks || 0}</td>
                    <td className="py-2 px-3 text-right">{day.totalConversions || 0}</td>
                    <td className="py-2 px-3 text-right">{Math.round((day.clickThroughRate || day.ctr || 0) * 100) / 100}%</td>
                    <td className="py-2 px-3 text-right">{Math.round(day.avgResponseTime || 0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Search Index</h2>
            <p className="text-sm text-gray-500 mt-1">Synchronize MongoDB indexes or rebuild the entire search index</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => searchAPI.syncIndexes().catch(() => {})}>
              Sync Indexes
            </Button>
            <Button variant="primary" size="sm" onClick={handleReindex} disabled={reindexing}>
              {reindexing ? 'Rebuilding...' : 'Rebuild Index'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
