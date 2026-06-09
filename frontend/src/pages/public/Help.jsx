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
    <div className="max-w-[1500px] mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <nav className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-primary-600 shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <span className="text-gray-900">Help Center</span>
      </nav>

      <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-12">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2 sm:mb-4">Help Center</h1>
        <p className="text-sm sm:text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">How can we help you today?</p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 max-w-4xl mx-auto">
        {helpTopics.map((topic) => (
          <Link key={topic.title} to={topic.link} className="p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <topic.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mb-2 sm:mb-3" />
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">{topic.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{topic.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
