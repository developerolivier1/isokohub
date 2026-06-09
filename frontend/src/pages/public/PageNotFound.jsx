import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function PageNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-display font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
      <Button to="/" variant="primary" size="lg">
        <Home className="h-5 w-5" /> Back to Home
      </Button>
    </div>
  );
}
