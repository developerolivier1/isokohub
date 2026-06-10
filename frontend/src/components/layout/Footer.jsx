import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Get to Know Us',
    links: [
      { name: 'Careers', to: '/about' },
      { name: 'Blog', to: '/about' },
      { name: 'About ISOKOHUB', to: '/about' },
      { name: 'Investor Relations', to: '/about' },
      { name: 'Press Releases', to: '/about' },
    ],
  },
  {
    title: 'Make Money with Us',
    links: [
      { name: 'Sell products', to: '/auth/register' },
      { name: 'Sell on business', to: '/auth/register' },
      { name: 'Become an affiliate', to: '/account/affiliate' },
      { name: 'Advertise Your Products', to: '/auth/register' },
      { name: 'Self-Publish with Us', to: '/auth/register' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { name: 'Your Account', to: '/account' },
      { name: 'Your Orders', to: '/account/orders' },
      { name: 'Shipping Rates & Policies', to: '/help' },
      { name: 'Returns & Replacements', to: '/help' },
      { name: 'Help', to: '/help' },
    ],
  },
  {
    title: 'Let Us Help You',
    links: [
      { name: 'Your Account', to: '/account' },
      { name: 'Your Orders', to: '/account/orders' },
      { name: 'Shipping Rates & Policies', to: '/help' },
      { name: 'Returns & Replacements', to: '/help' },
      { name: 'Assistant', to: '/help' },
      { name: 'Help', to: '/help' },
    ],
  },
];

export default function Footer() {
  return (
    <footer>
      <div className="bg-[#0f172a] text-white">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3">{group.title}</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {group.links.map((link) => (
                    <li key={link.name}>
                      <Link to={link.to} className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors">{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#020617] text-white border-t border-[#334155]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <div className="flex flex-col xs:flex-row items-center gap-3 sm:gap-6">
              <Link to="/" className="flex items-center">
                <img src="/assets/logo.png" alt="ISOKOHUB" className="h-10 sm:h-12 w-auto" />
              </Link>
              <div className="flex gap-1.5 sm:gap-2">
                {['English', 'RWF - RWF', 'Rwanda'].map((label) => (
                  <button key={label} className="text-[10px] sm:text-xs border border-gray-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm hover:border-white transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 sm:gap-x-8 gap-y-1.5 sm:gap-y-2 text-[10px] sm:text-xs text-gray-400">
              <Link to="/help" className="hover:text-white">ISOKOHUB Web Services</Link>
              <Link to="/account/wallet" className="hover:text-white">ISOKOHUB Pay</Link>
              <Link to="/auth/register" className="hover:text-white">ISOKOHUB Business</Link>
              <Link to="/products?category=music" className="hover:text-white">ISOKOHUB Music</Link>
              <Link to="/about" className="hover:text-white">ISOKOHUB Ads</Link>
              <Link to="/products" className="hover:text-white">ISOKOHUB Global</Link>
              <Link to="/products?category=books" className="hover:text-white">ISOKOHUB Books</Link>
              <Link to="/tracking" className="hover:text-white">ISOKOHUB Logistics</Link>
              <Link to="/auth/register" className="hover:text-white">Sell on ISOKOHUB</Link>
              <Link to="/social" className="hover:text-white">ISOKOHUBGlobal</Link>
              <Link to="/live" className="hover:text-white">ISOKOHUB Rapids</Link>
            </div>

            <div className="border-t border-[#334155] pt-4 sm:pt-6 w-full text-center">
              <p className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2">
                <Link to="/about" className="hover:text-white px-1.5 sm:px-2">Conditions of Use</Link>
                <Link to="/about" className="hover:text-white px-1.5 sm:px-2">Privacy Notice</Link>
                <Link to="/about" className="hover:text-white px-1.5 sm:px-2">Interest-Based Ads</Link>
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                &copy; {new Date().getFullYear()}, ISOKOHUB.com, Inc. or its affiliates
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
