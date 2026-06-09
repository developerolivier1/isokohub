import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: 'Shop Electronics',
    subtitle: 'Latest gadgets & devices at the best prices',
    cta: 'Shop Electronics',
    link: '/products?category=electronics',
    bg: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1500&q=80',
    mobileBg: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    color: 'from-slate-900/70 to-slate-900/30',
  },
  {
    id: 2,
    title: 'Traditional Fashion',
    subtitle: 'Discover authentic African designs and modern styles',
    cta: 'Explore Fashion',
    link: '/products?category=clothing-fashion',
    bg: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1500&q=80',
    mobileBg: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    color: 'from-purple-900/70 to-purple-900/30',
  },
  {
    id: 3,
    title: 'Home & Living',
    subtitle: 'Everything you need for your perfect home',
    cta: 'Shop Home',
    link: '/products?category=home-living',
    bg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1500&q=80',
    mobileBg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    color: 'from-emerald-900/70 to-emerald-900/30',
  },
  {
    id: 4,
    title: 'Flash Sale!',
    subtitle: 'Up to 50% off on top brands. Limited time offer.',
    cta: 'View Deals',
    link: '/products?deals=true',
    bg: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1500&q=80',
    mobileBg: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
    color: 'from-red-900/70 to-red-900/30',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const length = slides.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
  }, [length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? length - 1 : prev - 1));
  }, [length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full h-[180px] xs:h-[220px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px] overflow-hidden bg-gray-900">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <picture>
            <source media="(max-width: 480px)" srcSet={slide.mobileBg} />
            <source media="(max-width: 640px)" srcSet={slide.bg} />
            <img src={slide.bg} alt={slide.title} className="w-full h-full object-cover" />
          </picture>
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.color}`} />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-[1500px] mx-auto px-3 sm:px-8 w-full">
              <div className="max-w-[280px] xs:max-w-sm sm:max-w-xl">
                <h2 className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-3 drop-shadow-lg leading-tight">
                  {slide.title}
                </h2>
                <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white/90 mb-2 sm:mb-4 md:mb-6 drop-shadow leading-snug">
                  {slide.subtitle}
                </p>
                <Link
                  to={slide.link}
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-1.5 xs:px-5 xs:py-2 sm:px-8 sm:py-3 rounded-sm text-xs xs:text-sm sm:text-base transition-colors shadow-lg"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prev}
        className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-3 rounded-sm backdrop-blur-sm transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-3 rounded-sm backdrop-blur-sm transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
      </button>

      <div className="absolute bottom-2 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`rounded-full transition-all ${index === current ? 'w-4 h-1.5 sm:w-6 sm:h-2 bg-white' : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/50 hover:bg-white/80'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
