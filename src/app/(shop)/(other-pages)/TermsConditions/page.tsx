"use client";

import React from "react";

export default function TermsConditions() {
  const terms = [
    {
      title: "Acceptance of Terms",
      description: "By accessing our website, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions."
    },
    {
      title: "Privacy & Security",
      description: "Your privacy is important to us. We handle your data in accordance with our Privacy Policy and industry standards."
    },
    {
      title: "Product Availability",
      description: "All products and services are subject to availability. We reserve the right to modify or discontinue offerings without notice."
    },
    {
      title: "Pricing & Payments",
      description: "Prices are subject to change without prior notice. All payments are processed securely through our payment partners."
    },
    {
      title: "Service Terms",
      description: "We reserve the right to refuse service to anyone for any reason at any time, in accordance with applicable laws."
    },
    {
      title: "Jurisdiction",
      description: "Any disputes arising from these terms shall be resolved under the applicable laws of our jurisdiction."
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

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Floating Badge */}
          <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-[#0B3E81]/10 to-[#0B3E81]/5 rounded-full mb-8 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
            <div className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <span className="text-sm font-medium text-[#0B3E81]">⚖️ Legal Information</span>
            </div>
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0B3E81] mb-6 leading-tight opacity-0 translate-y-5 animate-[slideUp_0.8s_ease-out_forwards]">
            Terms & 
            <span className="relative inline-block ml-3">
              Conditions
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                <path d="M1 4C40 8 160 8 199 4" stroke="#0B3E81" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
              </svg>
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10 opacity-0 translate-y-5 animate-[slideUp_0.8s_ease-out_0.2s_forwards]">
            Please take a moment to review our terms of service. These guidelines help us 
            maintain a safe and fair environment for all users.
          </p>
          
          {/* Stats/Info Pills */}
          <div className="flex flex-wrap gap-4 justify-center opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
            <div className="group px-5 py-2.5 bg-white shadow-md rounded-full text-sm border border-gray-100 hover:border-[#0B3E81]/20 hover:shadow-lg transition-all duration-300">
              <span className="text-gray-600 group-hover:text-[#0B3E81] transition-colors">📅 Last updated: January 2024</span>
            </div>
            <div className="group px-5 py-2.5 bg-white shadow-md rounded-full text-sm border border-gray-100 hover:border-[#0B3E81]/20 hover:shadow-lg transition-all duration-300">
              <span className="text-gray-600 group-hover:text-[#0B3E81] transition-colors">📋 Version 2.0</span>
            </div>
            <div className="group px-5 py-2.5 bg-white shadow-md rounded-full text-sm border border-gray-100 hover:border-[#0B3E81]/20 hover:shadow-lg transition-all duration-300">
              <span className="text-gray-600 group-hover:text-[#0B3E81] transition-colors">⏱️ 5 min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Terms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {terms.map((term, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 relative overflow-hidden"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'fadeIn 0.8s ease-out forwards',
                opacity: 0
              }}
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0B3E81]/0 via-transparent to-transparent group-hover:from-[#0B3E81]/5 transition-all duration-500"></div>
              
              {/* Icon Container */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#0B3E81] opacity-0 group-hover:opacity-10 rounded-xl blur-xl transition-all duration-500"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-[#0B3E81]/5 to-[#0B3E81]/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl text-[#0B3E81] font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-[#0B3E81] mb-3 group-hover:translate-x-1 transition-transform duration-300">
                {term.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {term.description}
              </p>
              
              {/* Decorative Corner */}
              <div className="absolute bottom-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#0B3E81]/20 rounded-br-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information Cards */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Card */}
          <div className="bg-gradient-to-br from-[#0B3E81] to-[#1a4b9e] rounded-2xl p-8 text-white shadow-xl hover:scale-[1.02] transition-all duration-500 opacity-0 animate-[fadeIn_0.8s_ease-out_0.6s_forwards]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-3xl">❓</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Need Clarification?</h3>
                <p className="text-white/80 mb-4">
                  If you have any questions about our terms, our support team is here to help.
                </p>
                <button className="px-6 py-3 bg-white text-[#0B3E81] rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:scale-[1.02] transition-all duration-500 opacity-0 animate-[fadeIn_0.8s_ease-out_0.7s_forwards]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#0B3E81]/5 rounded-xl">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B3E81] mb-2">Quick Summary</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#0B3E81] rounded-full"></span>
                    By using our service, you agree to all terms
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#0B3E81] rounded-full"></span>
                    We respect your privacy and protect your data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#0B3E81] rounded-full"></span>
                    Terms may be updated with prior notice
                  </li>
                </ul>
              </div>
            </div>
          </div>
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
                Privacy Policy
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0B3E81] group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-500 hover:text-[#0B3E81] transition-colors duration-300 relative group">
                Cookie Policy
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

      {/* Add keyframes in a style tag */}
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