import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen, title, description, actionLabel, actionTo, onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-gray-500 mb-6 max-w-sm">{description}</p>}
      {actionLabel && (actionTo || onAction) && (
        <Button to={actionTo} onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
