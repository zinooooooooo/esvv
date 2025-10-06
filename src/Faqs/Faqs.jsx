import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const Faqs = () => {
  // Sample FAQ data - you can replace these with your actual FAQs
  const faqsData = [
    {
      id: 1,
      question: "FREQUENTLY ASKED QUESTIONS",
      answer: "This is the answer to the first frequently asked question. We provide detailed information here to help address common concerns and inquiries."
    },
    {
      id: 2,
      question: "FREQUENTLY ASKED QUESTIONS",
      answer: "This is the answer to the second frequently asked question. We provide detailed information here to help address common concerns and inquiries."
    },
    {
      id: 3,
      question: "FREQUENTLY ASKED QUESTIONS",
      answer: "This is the answer to the third frequently asked question. We provide detailed information here to help address common concerns and inquiries."
    },
    {
      id: 4,
      question: "FREQUENTLY ASKED QUESTIONS",
      answer: "This is the answer to the fourth frequently asked question. We provide detailed information here to help address common concerns and inquiries."
    },
    {
      id: 5,
      question: "FREQUENTLY ASKED QUESTIONS",
      answer: "This is the answer to the fifth frequently asked question. We provide detailed information here to help address common concerns and inquiries."
    }
  ];

  // State to track which FAQ is open
  const [openId, setOpenId] = useState(null);

  // Toggle FAQ open/close
  const toggleFaq = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="py-16 bg-blue-500 text-white">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-6">FREQUENTLY ASKED QUESTIONS</h2>
          <p className="max-w-2xl mx-auto">
            All of your most frequently asked questions in one place!
            We are continually updating this page so be sure to email us with specific questions.
          </p>
        </div>
        
        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqsData.map((faq) => (
            <div 
              key={faq.id} 
              className="bg-white rounded-sm shadow-sm overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left bg-white text-gray-800"
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={openId === faq.id}
              >
                <span className="font-medium">{faq.question}</span>
                <span className="text-blue-500">
                  {openId === faq.id ? <Minus size={20} /> : <Plus size={20} />}
                </span>
              </button>
              
              {openId === faq.id && (
                <div className="p-4 bg-gray-50 text-gray-700">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faqs;