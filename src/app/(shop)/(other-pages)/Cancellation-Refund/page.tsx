"use client";

import React from "react";

export default function CancellationRefundPage() {
  const cancellationPolicy = [
    {
      title: "Order Cancellation Window",
      description: "Orders can be cancelled within 1 hour of placement free of charge. After this window, orders may already be processed."
    },
    {
      title: "How to Cancel",
      description: "Log into your account and visit 'Order History' or contact customer support immediately with your order number."
    },
    {
      title: "Processing Cancellations",
      description: "Cancellation requests are processed within 24 hours. You'll receive a confirmation email once your cancellation is complete."
    },
    {
      title: "Pre-Order Cancellations",
      description: "Pre-orders can be cancelled anytime before the item ships. Payment will be refunded within 3-5 business days."
    },
    {
      title: "Subscription Cancellations",
      description: "Subscriptions can be cancelled anytime. Access continues until the end of your current billing period."
    },
    {
      title: "Non-Cancellable Items",
      description: "Digital downloads, personalized items, and gift cards cannot be cancelled once processed."
    }
  ];

  const refundPolicy = [
    {
      title: "Standard Returns",
      description: "Items can be returned within 30 days of delivery for a full refund. Items must be unused and in original packaging."
    },
    {
      title: "Refund Processing Time",
      description: "Refunds are processed within 5-7 business days after we receive your return. Credit card refunds may take additional time."
    },
    {
      title: "Partial Refunds",
      description: "Partial refunds may be issued for damaged items, opened products, or items not in original condition."
    },
    {
      title: "Return Shipping",
      description: "Customers are responsible for return shipping costs unless the item is defective or we made an error."
    },
    {
      title: "International Returns",
      description: "International returns must be shipped with tracking. Customs fees and duties are non-refundable."
    },
    {
      title: "Non-Refundable Items",
      description: "Final sale items, digital products, and gift cards are non-refundable."
    }
  ];

  const refundScenarios = [
    {
      scenario: "Defective Product",
      timeline: "3-5 business days",
      refundAmount: "100% + Return Shipping",
      note: "We cover all return costs"
    },
    {
      scenario: "Wrong Item Received",
      timeline: "2-4 business days",
      refundAmount: "100% + Return Shipping",
      note: "We'll arrange pickup"
    },
    {
      scenario: "Changed Mind",
      timeline: "5-7 business days",
      refundAmount: "100% (minus shipping)",
      note: "Item must be unused"
    },
    {
      scenario: "Damaged in Transit",
      timeline: "3-5 business days",
      refundAmount: "100% + Return Shipping",
      note: "Photos may be required"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Request Return",
      description: "Log into your account and initiate a return request, or contact our support team."
    },
    {
      step: "2",
      title: "Get Approval",
      description: "We'll review your request and send a return authorization within 24 hours."
    },
    {
      step: "3",
      title: "Ship Item Back",
      description: "Pack the item securely and ship it back using the provided return label."
    },
    {
      step: "4",
      title: "Receive Refund",
      description: "Once received and inspected, we'll process your refund within 5-7 business days."
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

      {/* Header Section */}
      <div className="relative pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-[#0B3E81]/10 to-[#0B3E81]/5 rounded-full mb-6 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
              <div className="flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                <span className="text-sm font-medium text-[#0B3E81]">🔄 Cancellation & Refund Policy</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#0B3E81] mb-6 leading-tight opacity-0 translate-y-5 animate-[slideUp_0.8s_ease-out_forwards]">
              Cancellation & Refund
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed opacity-0 translate-y-5 animate-[slideUp_0.8s_ease-out_0.2s_forwards]">
              We want you to be completely satisfied with your purchase. Learn about our cancellation and refund process below.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 justify-center mb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">30 Days</div>
              <div className="text-sm text-gray-500">Return Window</div>
            </div>
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">5-7 Days</div>
              <div className="text-sm text-gray-500">Refund Processing</div>
            </div>
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">100%</div>
              <div className="text-sm text-gray-500">Money-Back Guarantee</div>
            </div>
            <div className="px-6 py-3 bg-white shadow-lg rounded-2xl border border-gray-100">
              <div className="text-2xl font-bold text-[#0B3E81]">1 Hour</div>
              <div className="text-sm text-gray-500">Free Cancellation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* Cancellation Policy Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Cancellation Policy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cancellationPolicy.map((item, index) => (
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

        {/* Refund Policy Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Refund Policy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {refundPolicy.map((item, index) => (
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

        {/* Refund Scenarios Table */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Refund Scenarios</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#0B3E81] to-[#1a4b9e] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Scenario</th>
                    <th className="px-6 py-4 text-left font-semibold">Processing Time</th>
                    <th className="px-6 py-4 text-left font-semibold">Refund Amount</th>
                    <th className="px-6 py-4 text-left font-semibold">Additional Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refundScenarios.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.scenario}</td>
                      <td className="px-6 py-4 text-gray-600">{item.timeline}</td>
                      <td className="px-6 py-4 text-gray-600">{item.refundAmount}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Return Process Steps */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-[#0B3E81]/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3E81]">Return Process</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeIn 0.8s ease-out forwards',
                  opacity: 0
                }}
              >
                {/* Connector Line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#0B3E81]/20 to-transparent transform -translate-x-8"></div>
                )}
                
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0B3E81] to-[#1a4b9e] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-[#0B3E81] mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-20">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-800 mb-3">Important Notes</h3>
                <ul className="space-y-2 text-amber-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Refunds are issued to the original payment method
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Bank processing times may vary (3-10 business days)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Sale items are final sale and cannot be returned
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Original shipping costs are non-refundable
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Cancellation Contact */}
          <div className="bg-gradient-to-br from-[#0B3E81] to-[#1a4b9e] rounded-2xl p-8 text-white shadow-xl hover:scale-[1.02] transition-all duration-500 opacity-0 animate-[fadeIn_0.8s_ease-out_0.8s_forwards]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-3xl">🛑</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Need to Cancel?</h3>
                <p className="text-white/80 mb-4">
                  Contact us immediately for cancellation requests. Time is important!
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white text-[#0B3E81] rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Cancel Order
                  </button>
                  <button className="px-6 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                    Live Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Contact */}
          <div className="bg-gradient-to-br from-[#1a4b9e] to-[#0B3E81] rounded-2xl p-8 text-white shadow-xl hover:scale-[1.02] transition-all duration-500 opacity-0 animate-[fadeIn_0.8s_ease-out_0.9s_forwards]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <span className="text-3xl">💳</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Refund Status?</h3>
                <p className="text-white/80 mb-4">
                  Check your refund status or ask questions about your return.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white text-[#0B3E81] rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Track Refund
                  </button>
                  <button className="px-6 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                    Email Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-16 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 text-center opacity-0 animate-[fadeIn_0.8s_ease-out_1s_forwards]">
          <p className="text-sm text-gray-500">
            Last updated: January 2024 • This policy applies to all purchases made on our website. 
            We reserve the right to update these terms at any time.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200 bg-white/80 backdrop-blur-sm">
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
                Refunds
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0B3E81] group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </footer>

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