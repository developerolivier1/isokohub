import { Link } from 'react-router-dom';
import { Shield, Users, Globe, TrendingUp } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-[1500px] mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <nav className="flex items-center gap-1 xs:gap-2 text-xs xs:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-primary-600 shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <span className="text-gray-900">About ISOKOHUB</span>
      </nav>

      <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-2 sm:mb-4">About ISOKOHUB</h1>
        <p className="text-sm sm:text-base sm:text-lg text-gray-600">Africa's premier multi-vendor marketplace connecting millions of buyers and sellers across the continent.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-12 sm:mb-16">
        {[
          { icon: Shield, title: 'Trusted Platform', text: 'We verify every vendor to ensure authentic products and secure transactions.' },
          { icon: Users, title: 'Community Driven', text: 'Join a growing community of 10,000+ vendors and 500,000+ shoppers.' },
          { icon: Globe, title: 'Pan-African Reach', text: 'Connect with buyers and sellers from across Africa and beyond.' },
          { icon: TrendingUp, title: 'Growth Focused', text: 'Tools and analytics to help your business grow and succeed.' },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-xl shadow-sm">
            <div className="p-2 sm:p-3 bg-primary-50 rounded-lg shrink-0"><item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" /></div>
            <div><h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">{item.title}</h3><p className="text-xs sm:text-sm text-gray-600">{item.text}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
