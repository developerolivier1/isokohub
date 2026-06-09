import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Package, MapPin, Truck, CheckCircle, Clock, Search,
  ChevronRight, Phone, Navigation, User, ShieldCheck,
} from 'lucide-react';
import { deliveryAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function DeliveryTracking() {
  const { orderId } = useParams();
  const [trackingId, setTrackingId] = useState(orderId || '');
  const [tracking, setTracking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) handleTrack();
  }, [orderId]);

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await deliveryAPI.getTracking(trackingId);
      setTracking(data.data?.tracking || data.data);
      if (data.data?.driverId) setDriver(data.data.driverId);
    } catch (e) {
      setError('Unable to find tracking information for this order');
      setTracking(null);
    }
    setLoading(false);
  };

  const getCurrentStepIndex = () => {
    if (!tracking?.status) return 0;
    return statusSteps.findIndex(s => s.key === tracking.status);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Delivery Tracking</h1>

      {!orderId && (
        <Card>
          <div className="flex items-center gap-2">
            <Input
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              placeholder="Enter Order ID to track"
              icon={Search}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
            />
            <Button onClick={handleTrack} loading={loading}>Track</Button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </Card>
      )}

      {loading && <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>}

      {tracking && !loading && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Order #{tracking.orderId?._id || tracking.orderId || trackingId}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(tracking.createdAt || Date.now()).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant={tracking.status === 'delivered' ? 'success' : tracking.status === 'out_for_delivery' ? 'warning' : 'primary'} size="lg">
                {statusSteps.find(s => s.key === tracking.status)?.label || tracking.status}
              </Badge>
            </div>

            <div className="relative">
              {statusSteps.map((step, i) => {
                const currentIdx = getCurrentStepIndex();
                const done = i <= currentIdx;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${done ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={`w-0.5 h-full mt-1 ${done && i < currentIdx ? 'bg-primary-600' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`font-medium text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      {done && currentIdx === i && tracking.updatedAt && (
                        <p className="text-xs text-gray-500">{new Date(tracking.updatedAt).toLocaleTimeString()}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {driver && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Delivery Driver
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {driver.name?.[0] || 'D'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{driver.name || 'Driver'}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> {driver.distance ? `${driver.distance} km away` : 'En route'}
                    </p>
                  </div>
                </div>
                {driver.phone && (
                  <a href={`tel:${driver.phone}`} className="p-2.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                    <Phone className="h-5 w-5" />
                  </a>
                )}
              </div>
              {driver.vehicleInfo && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                  {driver.vehicleInfo.type && <span className="mr-4">{driver.vehicleInfo.type}</span>}
                  {driver.vehicleInfo.plateNumber && <span>{driver.vehicleInfo.plateNumber}</span>}
                </div>
              )}
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Details</h3>
            <div className="space-y-2 text-sm">
              {tracking.pickupAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Pickup</p>
                    <p className="text-gray-500">{tracking.pickupAddress}</p>
                  </div>
                </div>
              )}
              {tracking.deliveryAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Delivery</p>
                    <p className="text-gray-500">{tracking.deliveryAddress}</p>
                  </div>
                </div>
              )}
              {tracking.estimatedDelivery && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Estimated Delivery</p>
                    <p className="text-gray-500">{new Date(tracking.estimatedDelivery).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {!tracking && !loading && !error && orderId && (
        <Card><p className="text-gray-500 text-center py-8">No tracking information found</p></Card>
      )}
    </div>
  );
}
