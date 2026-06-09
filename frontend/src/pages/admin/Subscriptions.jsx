import { useState, useEffect } from 'react';
import { CreditCard, Check, Crown, Zap } from 'lucide-react';
import { tenantAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const plans = [
  {
    name: 'Basic', icon: Zap, price: 'Free', color: 'text-gray-600', bg: 'bg-gray-50',
    features: ['Up to 10 vendors', 'Basic analytics', 'Email support', '1 custom domain'],
  },
  {
    name: 'Professional', icon: Crown, price: '49,000 RWF/mo', color: 'text-primary-600', bg: 'bg-primary-50', popular: true,
    features: ['Up to 50 vendors', 'Advanced analytics', 'Priority support', '5 custom domains', 'API access', 'Live streaming'],
  },
  {
    name: 'Enterprise', icon: Zap, price: 'Custom', color: 'text-purple-600', bg: 'bg-purple-50',
    features: ['Unlimited vendors', 'Full analytics suite', '24/7 dedicated support', 'Unlimited domains', 'API access', 'Live streaming', 'AI recommendations', 'Custom integrations'],
  },
];

export default function Subscriptions() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tenantAPI.getSubscription()
      .then(({ data }) => setSubscription(data.data?.subscription || data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-500">Manage your plan and billing</p>
      </div>

      {subscription && (
        <Card className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-white/80" />
            <div>
              <p className="text-sm text-white/70">Current Plan</p>
              <p className="text-2xl font-bold capitalize">{subscription.plan || 'Basic'}</p>
            </div>
          </div>
          <Badge variant="default" className="bg-white/20 text-white">
            {subscription.status || 'Active'}
          </Badge>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-primary-600' : ''}`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </span>
            )}
            <div className={`p-3 rounded-xl w-fit mb-4 ${plan.bg}`}>
              <plan.icon className={`h-6 w-6 ${plan.color}`} />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 mb-1">{plan.name}</h3>
            <p className="text-2xl font-bold text-gray-900 mb-4">{plan.price}</p>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">
              {plan.name === 'Basic' ? 'Current Plan' : 'Upgrade'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
