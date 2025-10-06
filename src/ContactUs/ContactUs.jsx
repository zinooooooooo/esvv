import React from 'react';
import { Phone, Facebook, MapPin } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">GET IN TOUCH</h2>
          <div className="w-16 h-1 bg-blue-500 mx-auto mt-2 mb-10"></div>
          
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help. Reach out to us for inquiries, appointment concerns, or support with 
            our services. Your convenience is our priority — let us know how we can assist you today.
          </p>
        </div>
        
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mobile Number */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 flex items-center justify-center mb-4">
              <Phone size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">MOBILE NUMBER</h3>
            <p className="text-gray-600">+63 912 345 6789</p>
          </div>
          
          {/* Facebook */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 flex items-center justify-center mb-4">
              <a href="https://www.facebook.com/sanvicente.ilocossur" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-blue-600 transition-colors">
                <Facebook size={28} />
              </a>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">FACEBOOK</h3>
            <p className="text-gray-600">
              <a href="https://www.facebook.com/sanvicente.ilocossur" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                MSWDO SAN VICENTE
              </a>
            </p>
          </div>
          
          {/* Address */}
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 flex items-center justify-center mb-4">
              <a href="https://www.google.com/maps/place/San+Vicente+Municipal+Hall/@17.5932718,120.372041,17z/data=!3m1!4b1!4m6!3m5!1s0x338e651ba316424b:0xf35f715661a1324c!8m2!3d17.5932667!4d120.3746159!16s%2Fg%2F11r8v3tpx?entry=ttu&g_ep=EgoyMDI1MDQyOS4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-blue-600 transition-colors">
                <MapPin size={28} />
              </a>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">ADDRESS</h3>
            <p className="text-gray-600">
              <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                SAN VICENTE, ILOCOS SUR
              </a>
            </p>
          </div>
        </div>
        
        {/* Horizontal line/separator */}
        <div className="w-full h-px bg-gray-200 my-12"></div>
      </div>
    </div>
  );
};

export default ContactUs;