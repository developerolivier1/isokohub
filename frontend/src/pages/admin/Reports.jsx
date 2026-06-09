import { useState, useEffect } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { reportAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  const reports = [
    { title: 'Sales Report', description: 'Daily, weekly, and monthly sales data', icon: BarChart3, endpoint: 'sales' },
    { title: 'Product Report', description: 'Top selling and low performing products', icon: FileText, endpoint: 'products' },
    { title: 'Revenue Report', description: 'Revenue breakdown by source', icon: BarChart3, endpoint: 'revenue' },
    { title: 'Customer Report', description: 'Customer acquisition and retention', icon: FileText, endpoint: 'customers' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">{stats?.revenue?.toLocaleString() || 0} RWF</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Avg. Order Value</p>
          <p className="text-2xl font-bold">
            {stats?.totalOrders ? Math.round(stats.revenue / stats.totalOrders).toLocaleString() : 0} RWF
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Growth</p>
          <p className="text-2xl font-bold text-green-600">+12.5%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.title}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 rounded-lg">
                  <report.icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => reportAPI.download({ type: report.endpoint }).catch(() => {})}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Chart</h2>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400">
          Chart will render here (Chart.js)
        </div>
      </Card>
    </div>
  );
}
