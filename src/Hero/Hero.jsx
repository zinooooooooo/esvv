import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import senior from '../assets/senior.jpg';
import pwd from '../assets/pwd.jpeg';
import solo from '../assets/solo.png';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: senior,
      title: "Honoring Seniors with Heartfelt Care",
      description: "The MSWDO provides essential services for senior citizens, including financial assistance, healthcare support, social welfare programs, and livelihood opportunities to enhance their well-being."
    },
    {
      image: pwd,
      title: "Supporting Persons with Disabilities",
      description: "We offer comprehensive support programs designed to empower PWDs with accessible resources, equal opportunities, and community integration initiatives."
    },
    {
      image: solo,
      title: "Empowering Solo Parents",
      description: "Our dedicated programs assist solo parents with financial aid, livelihood training, counseling services, and educational support for their children."
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out ${
            currentSlide === index ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
          }`}
        >
          <div className="relative w-full h-full">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
            
            
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-20 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute top-40 right-32 w-3 h-3 bg-white/15 rounded-full animate-pulse delay-1000"></div>
              <div className="absolute bottom-32 left-40 w-1 h-1 bg-white/25 rounded-full animate-pulse delay-2000"></div>
              <div className="absolute bottom-20 right-20 w-2 h-2 bg-white/20 rounded-full animate-pulse delay-500"></div>
            </div>
            
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 md:px-12 lg:px-24">
              <div className={`max-w-5xl transition-all duration-1000 delay-300 ${
                currentSlide === index 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-8 opacity-0'
              }`}>
              
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent drop-shadow-2xl">
                    {slide.title}
                  </span>
                </h1>
                
               
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed font-light">
                  {slide.description}
                </p>
            
                <Link to="/appointment">
                  <button className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg">
                    <span className="relative z-10 flex items-center">
                      <svg className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      BOOK APPOINTMENT
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}


      <button 
        onClick={prevSlide} 
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-md transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-110 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5} />
      </button>
      
      <button 
        onClick={nextSlide} 
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-md transition-all duration-300 border border-white/20 hover:border-white/40 hover:scale-110 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 md:w-7 md:h-7" strokeWidth={2.5} />
      </button>


      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative overflow-hidden rounded-full transition-all duration-500 ${
              currentSlide === index 
                ? 'bg-white w-12 h-3 shadow-lg' 
                : 'bg-white/40 hover:bg-white/60 w-3 h-3 hover:scale-125'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {currentSlide === index && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 z-20">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300 ease-out"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        ></div>
      </div>

    
    </div>
  );
};

export default HeroCarousel;