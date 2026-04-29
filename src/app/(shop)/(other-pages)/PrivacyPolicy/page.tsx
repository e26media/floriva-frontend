"use client";

import React from "react";

export default function PoliciesPage() {
  const shippingPolicy = [
    {
      title: "Processing Time",
      description: "Orders are processed within 1-2 business days. You will receive a confirmation email once your order has been shipped."
    },
    {
      title: "Shipping Rates",
      description: "Shipping rates are calculated based on your location and the weight of your package. Free shipping is available on orders over $50."
    },
    {
      title: "Delivery Times",
      description: "Standard shipping: 3-5 business days. Express shipping: 1-2 business days. International shipping: 7-14 business days."
    },
    {
      title: "Tracking Information",
      description: "Once your order ships, you will receive a tracking number via email to monitor your package's journey."
    },
    {
      title: "Shipping Restrictions",
      description: "We currently ship to all 50 states and select international destinations. Some items may have shipping restrictions."
    },
    {
      title: "Lost or Damaged Packages",
      description: "If your package arrives damaged or is lost in transit, please contact us within 48 hours for assistance."
    }
  ];

  const privacyPolicy = [
    {
      title: "Information We Collect",
      description: "We collect personal information including name, email, shipping address, and payment details when you make a purchase."
    },
    {
      title: "How We Use Your Information",
      description: "Your information is used to process orders, improve our services, and send promotional offers (with your consent)."
    },
    {
      title: "Data Protection",
      description: "We implement security measures to protect your personal information. All payment data is encrypted and processed securely."
    },
    {
      title: "Cookies",
      description: "We use cookies to enhance your browsing experience and analyze site traffic. You can control cookies through your browser."
    },
    {
      title: "Third-Party Sharing",
      description: "We do not sell your personal information. Data is only shared with trusted partners for order fulfillment and payment processing."
    },
    {
      title: "Your Rights",
      description: "You have the right to access, correct, or delete your personal information. Contact us to exercise these rights."
    }
  ];

  const faqs = [
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 3-5 business days within the US. Express shipping is available for 1-2 business day delivery."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to select international destinations. International shipping typically takes 7-14 business days."
    },
    {
      question: "Is my payment information secure?",
      answer: "Absolutely! We use industry-standard encryption and secure payment processors. Your financial data is never stored on our servers."
    },
    {
      question: "Can I change or cancel my order?",
      answer: "Orders can be modified or cancelled within 1 hour of placement. Please contact customer support immediately for assistance."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F4F1] via-white to-[#F8F4F1] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0B3E81] opacity-5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#0B3E81] opacity-5 rounded-full blur-3xl animate-pulse [animation-delay:2000ms]"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0B3E81 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            opacity: 0.03
          }}
        ></div>
      </div>

      {/* Header with Tabs */}
      <div className="relative pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-[#0B3E81]/10 to-[#0B3E81]/5 rounded-full mb-6 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
              <div className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                <span className="text-sm font-medium text-[#0B3E81]">📋 Company Policies</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#0B3E81] mb-6 leading-tight opacity-0 translate-y-5 animate-[slideUp_0.8s_ease-out_forwards]">
              Shipping & Privacy
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed opacity-0 translate-y-5 animate-[slideUp_0.8s_ease-out_0.2s_forwards]">
              Learn about our shipping policies and how we protect your privacy. We&apos;re committed to transparency and your satisfaction.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 justify-center mb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">Free Shipping</div>
              <div className="text-sm text-gray-500">On orders $50+</div>
            </div>
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">24/7 Support</div>
              <div className="text-sm text-gray-500">Always here to help</div>
            </div>
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">100% Secure</div>
              <div className="text-sm text-gray-500">Encrypted payments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* Shipping Policy Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚚</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Shipping Policy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shippingPolicy.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeIn 0.8s ease-out forwards',
                  opacity: 0
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B3E81]/0 via-transparent to-transparent group-hover:from-[#0B3E81]/5 transition-all duration-500"></div>
                
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0B3E81]/5 to-[#0B3E81]/10 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-[#0B3E81]">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#0B3E81] mb-3 group-hover:translate-x-1 transition-transform duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy Policy Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Privacy Policy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {privacyPolicy.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeIn 0.8s ease-out forwards',
                  opacity: 0
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0B3E81]/0 via-transparent to-transparent group-hover:from-[#0B3E81]/5 transition-all duration-500"></div>
                
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0B3E81]/5 to-[#0B3E81]/10 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-[#0B3E81]">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#0B3E81] mb-3 group-hover:translate-x-1 transition-transform duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">❓</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeIn 0.8s ease-out forwards',
                  opacity: 0
                }}
              >
                <h3 className="text-lg font-bold text-[#0B3E81] mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-16">
          {/* Shipping Contact Card */}
          <div className="bg-gradient-to-br from-[#0B3E81] to-[#1a4b9e] rounded-2xl p-8 text-white shadow-xl hover:scale-[1.02] transition-all duration-500 opacity-0 animate-[fadeIn_0.8s_ease-out_0.8s_forwards]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-3xl">📦</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Shipping Questions?</h3>
                <p className="text-white/80 mb-4">
                  Contact our shipping team for order status and delivery inquiries.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white text-[#0B3E81] rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Track Order
                  </button>
                  <button className="px-6 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                    Email Support
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Contact Card */}
          
        </div>

        {/* Legal Notice */}
        <div className="mt-16 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 text-center opacity-0 animate-[fadeIn_0.8s_ease-out_1s_forwards]">
          <p className="text-sm text-gray-500">
            Last updated: January 2024 • These policies are effective immediately for all users. 
            We reserve the right to update these policies at any time.
          </p>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="relative border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} My Company. All rights reserved.
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-gray-500 hover:text-[#0B3E81] transition-colors duration-300 relative group">
                Terms
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0B3E81] group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#0B3E81] transition-colors duration-300 relative group">
                Shipping
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0B3E81] group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#0B3E81] transition-colors duration-300 relative group">
                Privacy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0B3E81] group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#0B3E81] transition-colors duration-300 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0B3E81] group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </footer> */}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}