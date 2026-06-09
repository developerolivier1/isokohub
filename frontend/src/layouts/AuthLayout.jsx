import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-2xl font-display font-bold">ISOKOHUB</span>
          </Link>
          <h1 className="text-4xl font-display font-bold mb-4">Welcome to the Future of Commerce</h1>
          <p className="text-lg text-white/80 max-w-md">
            Join thousands of businesses and shoppers on Africa's fastest growing multi-vendor marketplace platform.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: '10K+', label: 'Active Vendors' },
              { value: '1M+', label: 'Products' },
              { value: '500K+', label: 'Happy Customers' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
