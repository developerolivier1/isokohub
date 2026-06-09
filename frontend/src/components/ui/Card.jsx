export default function Card({ children, className = '', padding = true, hover = true }) {
  return (
    <div className={`bg-white rounded-xl ${hover ? 'shadow-card hover:shadow-soft' : 'shadow-card'} transition-shadow duration-300 ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
