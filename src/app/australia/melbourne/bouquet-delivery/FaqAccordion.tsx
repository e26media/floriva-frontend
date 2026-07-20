'use client'

import { useState } from 'react'
import { FAQS } from './seo'

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="mlb-faq-list">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div key={faq.question} className={`mlb-faq-item${isOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="mlb-faq-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{faq.question}</span>
              <span className="mlb-faq-icon" aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            <div
              className="mlb-faq-panel"
              role="region"
              hidden={!isOpen}
            >
              <p>{faq.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
