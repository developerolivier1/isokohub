import { Star } from 'lucide-react';

export default function ReviewStars({ rating = 0, count, size = 'sm', showCount = true }) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' };
  const starSize = sizes[size] || sizes.sm;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${star <= rating ? 'fill-blue-400 text-blue-400' : 'text-gray-300'}`}
        />
      ))}
      {showCount && count !== undefined && (
        <span className="text-sm text-gray-500 ml-1">({count})</span>
      )}
    </div>
  );
}
