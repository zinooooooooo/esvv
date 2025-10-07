import React from 'react';
import heroImage from '../assets/hero.png';
import childrenImage from '../assets/children.jpg';
import elderlyImage from '../assets/Elderly.jpg';
import fourPImage from '../assets/4p.jpg';

const AboutUs = () => {
  

  const galleryImages = [
    { id: 1, path: heroImage, alt: "DSWD workers providing relief" },
    { id: 2, path: childrenImage, alt: "DSWD Children's assistance" },
    { id: 3, path: elderlyImage, alt: "DSWD with elderly's" },
    { id: 4, path: fourPImage, alt: "DSWD aid distribution" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
       
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">eSVSMWDO</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mt-6"></div>
        </div>
        
       
        <div className="mb-16 max-w-3xl mx-auto">
          <p className="text-gray-700 text-center leading-relaxed">
            San Vicente is a small but historically rich municipality in Ilocos Sur, Philippines, known for its skilled woodcarving industry
            and deep cultural heritage. Located near Vigan City, it is part of the UNESCO-listed heritage zone and is famous for its
            traditional furniture-making, a craft passed down through generations. The town celebrates its annual Damili Festival,
            highlighting its pottery and craftsmanship. With a peaceful rural charm, friendly locals, and proximity to major tourist spots,
            San Vicente offers a blend of tradition and modernity, making it a unique destination in Ilocos Sur.
          </p>
        </div>
        
      
        <div className="grid grid-cols-2 gap-4">
          {galleryImages.map((image) => (
            <div key={image.id} className="relative overflow-hidden group">
              <img 
                src={image.path} 
                alt={image.alt} 
                className="w-full h-80 object-cover transition-all duration-300 grayscale hover:grayscale-0"
              />
           
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="absolute left-0 top-0 w-1 h-full bg-red-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </div>
          ))}
        </div>
        

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-red-600 mb-3">Our Mission</h3>
            <p className="text-gray-600">To provide immediate and comprehensive social welfare programs and disaster response to communities in need.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-red-600 mb-3">Our Vision</h3>
            <p className="text-gray-600">A responsive and proactive social welfare organization that uplifts communities through sustainable development.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-red-600 mb-3">Core Values</h3>
            <p className="text-gray-600">Service, integrity, compassion, and dedication to community empowerment and resilience.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;