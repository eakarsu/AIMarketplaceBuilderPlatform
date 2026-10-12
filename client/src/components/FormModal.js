import React, { useState, useEffect } from 'react';
import FullFieldPresets from './FullFieldPresets';

const examples = {
  destination: ['Kyoto, Japan', 'Lisbon, Portugal', 'Vancouver, Canada'],
  duration_days: [7, 5, 10],
  budget: [3500, 1800, 5200],
  interests: ['Temples, regional cuisine, design, and walkable neighborhoods', 'Architecture, local markets, music, and coastal day trips', 'Nature, food, museums, and accessible outdoor activities'],
  title: ['Customer onboarding launch', 'Sustainable product guide', 'Operations improvement plan'],
  topic: ['A practical guide to launching a customer onboarding program', 'How sustainable materials improve everyday products', 'Reducing support response time without reducing service quality'],
  description: ['Create a reusable validation helper with clear errors and unit-test examples.', 'Explain and improve an API integration while preserving its public contract.', 'Build an accessible status dashboard with loading, error, and empty states.'],
  code: ['function validateOrder(order) { return Boolean(order?.id && order?.items?.length); }', 'async function loadCatalog(api) { const { data } = await api.get("/catalog"); return data; }', 'const getStatusLabel = (status) => ({ ready: "Ready", blocked: "Blocked" }[status] || "Pending");'],
  subject: ['A welcoming neighborhood market at golden hour', 'A modular desk setup in a bright studio', 'A collaborative team planning session'],
  business_name: ['Northstar Market Studio', 'Harbor & Pine Goods', 'Clearpath Operations'],
  industry: ['Independent retail technology', 'Sustainable home goods', 'Customer support software'],
  target_market: ['Independent shop owners in North America', 'Eco-conscious urban professionals aged 25–45', 'Growing service teams with 20–200 employees'],
  recipient_type: ['New marketplace sellers', 'Returning customers', 'Operations team leads'],
  ingredients: ['Chickpeas, tomatoes, spinach, lemon, garlic, olive oil, and fresh herbs', 'Salmon, brown rice, cucumber, avocado, sesame, and ginger', 'Mushrooms, lentils, carrots, thyme, vegetable stock, and potatoes'],
  full_name: ['Jordan Lee', 'Casey Morgan', 'Riley Chen'],
  job_title: ['Senior Product Manager', 'Frontend Engineer', 'Customer Success Lead'],
  experience_years: [6, 4, 9],
  skills: ['Product strategy, customer research, roadmapping, analytics, stakeholder communication', 'React, JavaScript, accessibility, design systems, automated testing', 'Customer onboarding, team leadership, process design, reporting, retention strategy'],
  product_name: ['TrailLight Modular Backpack', 'QuietDesk Focus Lamp', 'FreshKeep Pantry Set'],
  target_audience: ['Weekend travelers who need flexible, durable storage', 'Remote professionals who want comfortable task lighting', 'Home cooks organizing compact kitchens'],
  key_features: ['Weather-resistant recycled fabric, removable organizer, padded laptop sleeve, lifetime repair program', 'Adjustable color temperature, glare-free shade, timer, recycled aluminum body', 'Airtight stackable containers, date markers, dishwasher-safe components, modular sizes'],
  setting: ['A near-future coastal city during its annual lantern festival', 'A remote mountain observatory during the first winter storm', 'A busy neighborhood café on the morning of a community election'],
  characters: ['Mara, a careful cartographer; Ivo, an optimistic mechanic; and Sen, a skeptical harbor pilot', 'Dr. Amara Cole, an astronomer; Theo, a new technician; and an unexpected radio caller', 'Nia, the café owner; Luis, a local reporter; and Bea, a longtime resident'],
  original_text: ['Thank you for joining our marketplace. Your storefront is ready for review.', 'The updated delivery estimate is Friday at 3:00 PM. We will notify you of any changes.', 'Please review the attached project summary and confirm the next steps by Tuesday.'],
  url: ['https://example.com/guides/marketplace-launch', 'https://example.com/products/sustainable-home', 'https://example.com/services/customer-support'],
  page_title: ['Marketplace Launch Guide for Independent Sellers', 'Sustainable Home Products and Materials', 'Customer Support Operations Playbook'],
  keywords: ['marketplace launch, seller onboarding, online storefront, independent retail', 'sustainable home goods, recycled materials, durable products, responsible design', 'customer support operations, response time, service quality, support workflow'],
  scenario: ['A new customer needs help choosing the correct plan before a Friday deadline.', 'A returning buyer reports a delayed order and wants a clear resolution timeline.', 'A seller needs guidance updating a listing without losing approved content.'],
  category: ['Travel accessories', 'Home office lighting', 'Kitchen organization'],
  features: ['Recycled shell, modular dividers, padded laptop compartment, repairable hardware', 'Glare-free illumination, adjustable warmth, timer, low-energy LEDs', 'Airtight seals, modular sizing, date labels, dishwasher-safe materials'],
  price: [129, 79, 249],
  hashtags: ['#MarketplaceTips #SmallBusiness #SellerSuccess', '#SustainableDesign #HomeGoods #BuiltToLast', '#CustomerExperience #Operations #ServiceDesign'],
  goal: ['Build a practical four-week foundation and complete one portfolio project.', 'Develop job-ready skills through weekly practice and two reviewed projects.', 'Create an advanced capstone, document decisions, and prepare a presentation for reviewers.'],
};

function presetValue(field, variant) {
  if (field.type === 'select') {
    const offset = field.name === 'target_language' ? 1 : 0;
    return field.options[(variant + offset) % field.options.length];
  }
  const values = examples[field.name];
  if (values) return values[variant];
  if (field.type === 'number') return [10, 25, 50][variant];
  return `${field.label} complete example ${variant + 1}`;
}

export function featureFormPresets(fields) {
  return ['Launch example', 'Operations example', 'Growth example'].map((label, variant) => ({
    label,
    values: Object.fromEntries(fields.map((field) => [field.name, presetValue(field, variant)])),
  }));
}

export default function FormModal({ fields, item, onSubmit, onClose, title }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      const defaults = {};
      fields.forEach(f => {
        defaults[f.name] = f.type === 'number' ? '' : '';
      });
      setFormData(defaults);
    }
  }, [item, fields]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <FullFieldPresets
              value={formData}
              presets={featureFormPresets(fields)}
              onChange={setFormData}
            />
            {fields.map(field => (
              <div key={field.name} className="form-group">
                <label>{field.label}{field.required && ' *'}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    required={field.required}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{item ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
