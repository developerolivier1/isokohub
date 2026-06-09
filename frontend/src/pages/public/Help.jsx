import { Link } from 'react-router-dom';
import { Search, Package, CreditCard, Truck, Shield, MessageCircle } from 'lucide-react';

const helpTopics = [
  { icon: Package, title: 'Your Orders', desc: 'Track, cancel, or return an order', link: '/account/orders' },
  { icon: CreditCard, title: 'Payment Settings', desc: 'Manage payment methods and wallet', link: '/account/wallet' },
  { icon: Truck, title: 'Shipping & Delivery', desc: 'Delivery times, rates, and tracking', link: '/tracking' },
  { icon: Shield, title: 'Returns & Refunds', desc: 'Return items and get refunds', link: '/' },
  { icon: MessageCircle, title: 'Contact Us', desc: '24/7 customer support', link: '/' },
  { icon: Search, title: 'More Help', desc: 'Browse all help topics', link: '/' },
];

export default function Help() {
  return (
    <div className="page-container py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <span className="text-gray-900">Help Center</span>
      </nav>

      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Help Center</h1>
        <p className="text-lg text-gray-600 mb-6">How can we help you today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {helpTopics.map((topic) => (
          <Link key={topic.title} to={topic.link} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <topic.icon className="h-8 w-8 text-primary-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">{topic.title}</h3>
            <p className="text-sm text-gray-600">{topic.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
