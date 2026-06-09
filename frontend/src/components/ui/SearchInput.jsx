import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({ value: externalValue, onChange, placeholder = 'Search...', className = '', onClear }) {
  const [internalValue, setInternalValue] = useState('');

  const value = externalValue !== undefined ? externalValue : internalValue;
  const setValue = onChange ? (v) => onChange(v) : setInternalValue;

  const handleClear = useCallback(() => {
    setValue('');
    if (onClear) onClear();
  }, [setValue, onClear]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 placeholder-gray-400"
      />
      {value && (
        <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
