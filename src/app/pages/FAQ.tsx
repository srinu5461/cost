// FAQ Page - Frequently Asked Questions with interactive categories and search
import { useState } from 'react';
import { Link } from 'react-router';
import { HelpCircle, Search, ChevronDown, Phone, Mail, ArrowRight, ShieldCheck, Truck, DollarSign, Package, Headphones } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

interface FAQItem {
  id: string;
  category: 'pricing' | 'shipping' | 'orders' | 'warranty';
  question: string;
  answer: string;
}

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<string[]>(['q-1', 'q-2']);

  const faqItems: FAQItem[] = [
    {
      id: 'q-1',
      category: 'pricing',
      question: 'How does the Cost Price + $100 model work?',
      answer: 'We operate on 100% price transparency. We purchase commercial catering equipment directly from official importer list prices and add a fixed $100 gross margin per unit regardless of retail value. No hidden markups, no inflated dealer margins.'
    },
    {
      id: 'q-2',
      category: 'shipping',
      question: 'Where can I pick up my ordered stock?',
      answer: 'Orders can be picked up directly from Nisbets warehouse hubs across Australia, including Sydney, Melbourne, Brisbane, Perth, and Adelaide. Once your order is processed, we provide warehouse collection details and pickup codes.'
    },
    {
      id: 'q-3',
      category: 'shipping',
      question: 'How is commercial shipping calculated?',
      answer: 'Shipping is calculated at checkout based on cubic weight and freight destination. We partner with specialized commercial freight providers including COPE Sensitive Freight and StarTrack to ensure safe delivery of heavy equipment.'
    },
    {
      id: 'q-4',
      category: 'orders',
      question: 'Are all listed prices inclusive of GST?',
      answer: 'Yes! All equipment prices displayed on Costplus100 are strictly in Australian Dollars (AUD) and include 10% Goods and Services Tax (GST). Tax invoices are automatically generated upon payment.'
    },
    {
      id: 'q-5',
      category: 'warranty',
      question: 'What warranty coverage comes with commercial equipment?',
      answer: 'Every machine sold on Costplus100 includes full factory manufacturer warranty (typically 1 to 2 years parts & labor). On-site brand service technician dispatch is available nationwide.'
    },
    {
      id: 'q-6',
      category: 'pricing',
      question: 'Can Fair Trading or government auditors verify your pricing?',
      answer: 'Yes! We publicly invite Fair Trading authorities and enterprise auditors to inspect any commercial transaction. We provide full trade invoice verification upon request.'
    },
    {
      id: 'q-7',
      category: 'orders',
      question: 'Do you offer bulk discounts or custom quotes for multi-unit packages?',
      answer: 'Yes! For large commercial kitchen fitouts or multi-unit chain purchases, contact our sales specialists for tailored freight bundling and enterprise quotations.'
    },
    {
      id: 'q-8',
      category: 'warranty',
      question: 'What happens if an item arrives damaged in transit?',
      answer: 'If your shipment arrives with transit damage, notify us within 48 hours with photos. We arrange immediate pickup and dispatch a replacement unit with zero additional shipping cost to you.'
    }
  ];

  const toggleAccordion = (id: string) => {
    setOpenIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredItems = faqItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white pb-20">
      <SEOHead
        title="Frequently Asked Questions (FAQ) | Cost Plus 100"
        description="Find answers to common questions about Cost Plus 100 pricing model, Nisbets pickup locations, shipping options, GST, and manufacturer warranty."
        canonical="https://costplus100.com.au/faq"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO HEADER (Full-Width Top Navbar Dark Navy bg-[#0F172A])
         ---------------------------------------------------- */}
      <section className="w-full bg-[#0F172A] text-white py-10 sm:py-14 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
            FREQUENTLY ASKED QUESTIONS
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Got Questions? We've Got Answers
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Everything you need to know about our $100 fixed markup model, Australia-wide delivery, Nisbets pickups, and warranties.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto pt-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. Nisbets, warranty, shipping)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/20 transition-all shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 2: CATEGORY FILTER TABS
         ---------------------------------------------------- */}
      <section className="w-full bg-slate-50 border-b border-slate-200/80 py-4">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
            {[
              { id: 'all', label: 'All Questions', icon: HelpCircle },
              { id: 'pricing', label: 'Pricing & $100 Model', icon: DollarSign },
              { id: 'shipping', label: 'Shipping & Pickups', icon: Truck },
              { id: 'orders', label: 'Orders & GST', icon: Package },
              { id: 'warranty', label: 'Warranties & Support', icon: ShieldCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#E31837] text-white shadow-md'
                      : 'bg-white text-slate-600 hover:text-[#0F172A] border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 3: ACCORDION LIST & SIDEBAR CONTAINER
         ---------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: FAQ Accordions (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {filteredItems.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <HelpCircle className="size-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-extrabold text-[#0F172A]">No Matching Questions Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search keywords or reach out directly to our customer support team.
                </p>
                <Link to="/contact">
                  <Button className="bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                    Contact Customer Support
                  </Button>
                </Link>
              </div>
            ) : (
              filteredItems.map(item => {
                const isOpen = openIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs hover:border-[#E31837]/60 transition-all"
                  >
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="size-8 rounded-lg bg-red-50 text-[#E31837] flex items-center justify-center shrink-0 border border-red-100 mt-0.5">
                          <HelpCircle className="size-4" />
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] leading-snug">
                          {item.question}
                        </h3>
                      </div>
                      <div className={`size-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 transition-transform ${isOpen ? 'rotate-180 bg-red-50 text-[#E31837]' : ''}`}>
                        <ChevronDown className="size-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Assistance Cards (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Direct Phone Assistance */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#0F172A] uppercase tracking-wider">
                <Headphones className="size-4 text-[#E31837]" />
                <span>Need Instant Help?</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Speak directly with our Australian catering equipment specialists Monday to Friday.
              </p>
              <a
                href="tel:1800516246"
                className="w-full bg-white border border-slate-200 hover:border-[#E31837] p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group"
              >
                <div className="size-9 rounded-lg bg-red-50 text-[#E31837] flex items-center justify-center shrink-0">
                  <Phone className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toll-Free Phone</span>
                  <span className="text-sm font-black text-[#0F172A] group-hover:text-[#E31837]">1800 516 246</span>
                </div>
              </a>
            </div>

            {/* Email Support Card */}
            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                <Mail className="size-4" />
                <span>Custom Quotations</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Require a custom quote for a major kitchen build or multi-unit catering equipment package?
              </p>
              <Link to="/contact">
                <Button className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2">
                  <span>Send Us a Message</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
