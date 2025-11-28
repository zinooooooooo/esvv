import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, ScrollText, X } from 'lucide-react';
import logo from '../assets/logo.png';
import svlogo from '../assets/svlogo.png';

const ContactUs = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <div className="w-full">
      {/* EDITABLE: Header Section with Background Image */}
      <div 
        className="relative w-full h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: 'url("https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh1_L724mnPAbAnwliSIkXThX_hscxbTkErJDwmgHHhOwFW1hsp-DCzwELGQD_0HXUEEAJG89kA2M_He-q8eJCaGzOPU0M9f_jFu8ckQlc3LyKwq7CyqvUiZHQJMWn0aplxyZT4DZl1Xnw/s640/sv1.JPG")', // EDITABLE: Replace with your municipality image URL
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(80, 80, 80, 0.5)' // EDITABLE: Adjust overlay color/opacity
        }}
        data-editable="header-background"
      >
        <div className="text-center text-white z-10 px-4 flex flex-col items-center justify-center">
          {/* EDITABLE: Logos */}
          <div 
            className="flex justify-center items-center gap-6 mb-2"
            data-editable="header-logos"
          >
            <img 
              src={logo} 
              alt="Logo 1" 
              className="h-20 md:h-24 w-20 md:w-24 object-contain drop-shadow-lg"
              data-editable="logo-1"
            />
            <img 
              src={svlogo} 
              alt="Logo 2" 
              className="h-20 md:h-24 w-20 md:w-24 object-contain drop-shadow-lg"
              data-editable="logo-2"
            />
          </div>
          {/* EDITABLE: Main Title */}
          <h1 
            className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg"
            data-editable="header-title"
          >
            About Us
          </h1>
          {/* EDITABLE: Subtitle */}
          <p 
            className="text-xl md:text-2xl drop-shadow-md"
            data-editable="header-subtitle"
          >
            Building Our Future, Together.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* EDITABLE: Our History Section */}
        <div 
          className="bg-white rounded-lg shadow-md p-8 mb-12"
          data-editable="history-section"
        >
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="text-blue-600" size={24} />
            {/* EDITABLE: History Title */}
            <h2 
              className="text-3xl font-bold text-gray-900"
              data-editable="history-title"
            >
              Our History
            </h2>
          </div>
          
          {/* EDITABLE: History Subtitle */}
          <p 
            className="text-gray-600 mb-6 text-lg"
            data-editable="history-subtitle"
          >
            Tracing the roots of our community's growth and progress.
          </p>
          
          {/* EDITABLE: History Paragraph 1 */}
          <p 
            className="text-gray-700 mb-4 leading-relaxed"
            data-editable="history-paragraph-1"
          >San Vicente’s early history is closely tied to Vigan, which was founded by Juan de Salcedo in 1573. After his return in 1574, Salcedo brought Augustinian friars to Christianize the area, later replaced by Franciscans in 1579, who extended their missionary work to what is now San Vicente. By 1591, Vigan had an organized local government that included the barrios of Tuanong, Sta. Catalina de Baba, and Caoayan, with a population of around 4,000. Between 1720 and 1737, the first chapel in Bo. Tuanong—San Vicente’s former name—was built, and records from 1748 indicate active religious life, including the organization of the Confraternity of Jesus of Nazareth and documented funerals held at the stone chapel.

Difficult travel between Vigan and its barrios during the rainy season led to the eventual separation of Bo. Tuanong and Bo. Sta. Catalina de Baba from Vigan in 1793. By 1751, Bo. Tuanong already had its own chaplain and nearby Barangay San Sebastian had also been established. In 1795, Bo. Tuanong officially became San Vicente de Ferrer with the establishment of the municipal seat and church. Don Pedro de Leon, the town’s first parish priest, is credited with initiating the construction of the San Vicente Church, marking the formal development of the municipality.
          </p>
          
          {/* EDITABLE: History Paragraph 2 */}
          <p 
            className="text-gray-700 leading-relaxed"
            data-editable="history-paragraph-2"
          >
            Embracing our responsibility to the environment, we launched the Community Green Initiative in 2015, a testament to our commitment to a sustainable future. From a humble settlement to a thriving, forward-thinking municipality, our history is one of resilience, innovation, and community collaboration.
          </p>
        </div>

        {/* EDITABLE: Contact & Office Hours Section */}
        <div 
          className="bg-white rounded-lg shadow-md p-8"
          data-editable="contact-section"
        >
          {/* EDITABLE: Contact Section Title */}
          <h2 
            className="text-3xl font-bold text-gray-900 mb-8"
            data-editable="contact-title"
          >
            Contact & Office Hours
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Contact Information */}
            <div className="space-y-6">
              {/* EDITABLE: Municipal Hall Address */}
              <div data-editable="contact-address">
                <div className="flex items-start gap-3 mb-2">
                  <MapPin className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">San Vicente Municipal Hall Address</h3>
                    <p className="text-gray-700 mb-2">Poblacion, San Vicente, Ilocos Sur</p>
                    <a 
                      href="https://www.google.com/maps/place/San+Vicente+Municipal+Hall/@17.5987192,120.3734202,15.39z/data=!4m6!3m5!1s0x338e651ba316424b:0xf35f715661a1324c!8m2!3d17.5932667!4d120.3746159!16s%2Fg%2F11r8v3tpx?entry=ttu&g_ep=EgoyMDI1MTExNy4wIKXMDSoASAFQAw%3D%3D" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                      data-editable="contact-directions-link"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>
              
              {/* EDITABLE: General Inquiries Phone */}
              <div data-editable="contact-phone">
                <div className="flex items-start gap-3 mb-2">
                  <Phone className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Contact Number</h3>
                    <p className="text-gray-700">(+63)123456789</p>
                  </div>
                </div>
              </div>
              
              {/* EDITABLE: Email */}
              <div data-editable="contact-email">
                <div className="flex items-start gap-3 mb-2">
                  <Mail className="text-blue-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-700">info@progress.gov</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Office Hours */}
            <div data-editable="office-hours">
              <div className="flex items-start gap-3">
                <Clock className="text-blue-600 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Office Hours</h3>
                  <p className="text-gray-700 mb-1">Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p className="text-gray-700">Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDITABLE: Footer Section */}
      <footer 
        className="bg-gray-100 py-6 mt-12"
        data-editable="footer-section"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* EDITABLE: Copyright Text */}
            <p 
              className="text-gray-700 text-sm md:text-base"
              data-editable="footer-copyright"
            >
              ©2024 Municipality of Progress. All Rights Reserved.
            </p>
            
            {/* EDITABLE: Footer Links */}
            <div 
              className="flex gap-6"
              data-editable="footer-links"
            >
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-gray-700 hover:text-gray-900 text-sm md:text-base transition-colors cursor-pointer"
                data-editable="footer-privacy-link"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setShowTermsModal(true)}
                className="text-gray-700 hover:text-gray-900 text-sm md:text-base transition-colors cursor-pointer"
                data-editable="footer-terms-link"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPrivacyModal(false)}
          data-editable="privacy-modal-backdrop"
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            data-editable="privacy-modal-content"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 
                className="text-2xl font-bold text-gray-900"
                data-editable="privacy-modal-title"
              >
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="px-6 py-6">
              {/* EDITABLE: Privacy Policy Content */}
              <div 
                className="prose max-w-none text-gray-700"
                data-editable="privacy-policy-content"
              >
                <p className="mb-4">
                  <strong>Last Updated:</strong> January 2024
                </p>
                <p className="mb-4">
                  The Municipality of Progress ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Information We Collect</h3>
                <p className="mb-4">
                  We may collect information that you provide directly to us, including but not limited to your name, email address, phone number, and any other information you choose to provide when using our services or contacting us.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">How We Use Your Information</h3>
                <p className="mb-4">
                  We use the information we collect to provide, maintain, and improve our services, respond to your inquiries, send you administrative information, and comply with legal obligations.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Information Sharing</h3>
                <p className="mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Data Security</h3>
                <p className="mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Contact Us</h3>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy, please contact us at info@progress.gov.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowTermsModal(false)}
          data-editable="terms-modal-backdrop"
        >
          <div 
            className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            data-editable="terms-modal-content"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 
                className="text-2xl font-bold text-gray-900"
                data-editable="terms-modal-title"
              >
                Terms of Service
              </h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="px-6 py-6">
              {/* EDITABLE: Terms of Service Content */}
              <div 
                className="prose max-w-none text-gray-700"
                data-editable="terms-of-service-content"
              >
                <p className="mb-4">
                  <strong>Last Updated:</strong> January 2024
                </p>
                <p className="mb-4">
                  Please read these Terms of Service ("Terms") carefully before using the services provided by the Municipality of Progress ("we," "our," or "us").
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Acceptance of Terms</h3>
                <p className="mb-4">
                  By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Use of Services</h3>
                <p className="mb-4">
                  You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services in any way that could damage, disable, overburden, or impair our services or interfere with any other party's use of our services.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">User Accounts</h3>
                <p className="mb-4">
                  If you create an account with us, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Intellectual Property</h3>
                <p className="mb-4">
                  All content, features, and functionality of our services are owned by the Municipality of Progress and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Limitation of Liability</h3>
                <p className="mb-4">
                  To the fullest extent permitted by law, the Municipality of Progress shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Changes to Terms</h3>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page.
                </p>
                <h3 className="text-xl font-semibold mb-3 mt-6">Contact Us</h3>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us at info@progress.gov.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;