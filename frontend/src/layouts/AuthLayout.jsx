import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Link to="/" className="flex items-center mb-12">
            <img src="/assets/logo.png" alt="ISOKOHUB" className="h-16 w-auto" />
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
