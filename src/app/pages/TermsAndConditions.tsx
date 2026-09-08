// Terms and Conditions Page - Legal terms with admin-editable content & mobile responsive styling
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { FileText, Calendar, AlertCircle, ShieldCheck, Clock, CheckCircle2, ChevronRight, Mail, ArrowRight, Menu } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function TermsAndConditions() {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch(`${API_URL}/legal/terms-and-conditions`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || getDefaultContent());
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      } else {
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.error('Failed to load terms:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
      <h2 id="sec-1">1. Introduction</h2>
      <p>Welcome to Costplus100. These terms and conditions outline the rules and regulations for the use of our website and commercial equipment supply services.</p>
      
      <h2 id="sec-2">2. Acceptance of Terms</h2>
      <p>By accessing this website and placing an order, you accept these terms and conditions in full. If you disagree with any part of these terms, you must not use our website.</p>
      
      <h2 id="sec-3">3. Products and Pricing</h2>
      <p>All products and services are subject to availability. We operate under a transparent fixed-margin business model of true wholesale cost price plus a fixed $100 markup.</p>
      <ul>
        <li>Product descriptions are accurate to the best of our knowledge</li>
        <li>Images are for illustrative purposes only</li>
        <li>Prices are subject to change without notice based on importer list updates</li>
        <li>All prices are displayed in Australian Dollars (AUD) and include GST</li>
      </ul>
      
      <h2 id="sec-4">4. Orders and Payments</h2>
      <p>By placing an order, you warrant that:</p>
      <ul>
        <li>You are legally capable of entering into binding commercial contracts</li>
        <li>You are at least 18 years old</li>
        <li>The information you provide is accurate and complete</li>
      </ul>
      <p>We accept payment via credit card, debit card, and bank transfer through our secure payment gateway partners.</p>
      
      <h2 id="sec-5">5. Shipping and Delivery</h2>
      <p>Delivery times are estimates only and may vary depending on location and product availability. We ship Australia-wide with standard delivery taking 3-5 business days for most commercial items.</p>
      
      <h2 id="sec-6">6. Returns and Refunds</h2>
      <p>Please refer to our Return & Refund Policy for detailed information about commercial returns, exchanges, and warranty claims.</p>
      
      <h2 id="sec-7">7. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Costplus100 shall not be liable for any indirect, incidental, or consequential damages arising from the use of our commercial products or services.</p>
      
      <h2 id="sec-8">8. Privacy</h2>
      <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.</p>
      
      <h2 id="sec-9">9. Intellectual Property</h2>
      <p>All content on this website, including text, graphics, logos, and images, is the property of Costplus100 and protected by Australian copyright laws.</p>
      
      <h2 id="sec-10">10. Governing Law</h2>
      <p>These terms are governed by the laws of Australia. Any disputes will be subject to the exclusive jurisdiction of Australian courts.</p>
    `;
  };

  const navItems = [
    { title: '1. Introduction', id: 'sec-1' },
    { title: '2. Acceptance of Terms', id: 'sec-2' },
    { title: '3. Products & Pricing', id: 'sec-3' },
    { title: '4. Orders & Payments', id: 'sec-4' },
    { title: '5. Shipping & Delivery', id: 'sec-5' },
    { title: '6. Returns & Refunds', id: 'sec-6' },
    { title: '7. Limitation of Liability', id: 'sec-7' },
    { title: '8. Privacy Policy', id: 'sec-8' },
    { title: '9. Intellectual Property', id: 'sec-9' },
    { title: '10. Governing Law', id: 'sec-10' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowMobileNav(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E31837] mb-4"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Legal Documentation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white pb-20">
      <SEOHead
        title="Terms & Conditions | Cost Plus 100 Catering Equipment"
        description="Review the terms and conditions for purchasing commercial catering equipment from Cost Plus 100. Transparent pricing, Australia-wide shipping, and warranty policies."
        canonical="https://costplus100.com.au/terms-and-conditions"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO HEADER (Full-Width Top Navbar Dark Navy bg-[#0F172A])
         ---------------------------------------------------- */}
      <section className="w-full bg-[#0F172A] text-white py-10 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
            LEGAL GOVERNANCE
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Terms & Conditions
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Please read these commercial terms carefully before placing an order or using our services.
          </p>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
            {lastUpdated && (
              <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold">
                <Calendar className="size-3.5 text-[#E31837]" />
                <span>Updated: {new Date(lastUpdated).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold">
              <Clock className="size-3.5 text-emerald-400" />
              <span>5 Min Read</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-blue-400" />
              <span>Cost Price + $100 Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 2: MAIN CONTENT CONTAINER (2 Columns Layout)
         ---------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left Column: Quick Navigation Sidebar (4 Cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            
            {/* Mobile Nav Toggle */}
            <div className="lg:hidden bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <FileText className="size-4 text-[#E31837]" />
                <span>Jump to Section</span>
              </span>
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="text-xs font-bold text-[#E31837] bg-red-50 px-3 py-1 rounded-lg border border-red-100 flex items-center gap-1 cursor-pointer"
              >
                <span>{showMobileNav ? 'Hide Navigation' : 'Show Navigation'}</span>
                <ChevronRight className={`size-3.5 transition-transform ${showMobileNav ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Quick Navigation Card (Desktop always visible, Mobile conditionally visible) */}
            <div className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 ${showMobileNav ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="size-4 text-[#E31837]" />
                  <span>Quick Navigation</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">10 Clauses</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1 text-xs font-medium text-slate-600">
                {navItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-white hover:text-[#E31837] transition-all cursor-pointer group"
                  >
                    <span className="font-semibold text-slate-700 group-hover:text-[#E31837]">{item.title}</span>
                    <ChevronRight className="size-3.5 text-slate-400 group-hover:text-[#E31837]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                <Mail className="size-4" />
                <span>Legal Assistance</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Have questions about our commercial terms or Fair Trading review invitations?
              </p>
              <Link to="/contact">
                <Button className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2">
                  <span>Contact Our Team</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Legal Content Showcase (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* AUD & GST Notice Card */}
            <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <CheckCircle2 className="size-5 text-[#E31837] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Australian Commercial Pricing Compliance</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  All equipment prices displayed on Costplus100 are strictly in Australian Dollars (AUD) and inclusive of Goods and Services Tax (GST). We operate with 100% transparency and publicly invite Fair Trading authorities to review any sale at any time.
                </p>
              </div>
            </div>

            {/* Content Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-8 shadow-2xs space-y-6">
              <style>{`
                .legal-content h2 {
                  font-size: 1.125rem;
                  font-weight: 900;
                  color: #0F172A;
                  margin-top: 1.75rem;
                  margin-bottom: 0.5rem;
                  padding-bottom: 0.35rem;
                  border-bottom: 2px solid #E31837;
                  display: inline-block;
                  scroll-margin-top: 6rem;
                }
                .legal-content h2:first-child {
                  margin-top: 0;
                }
                .legal-content p {
                  font-size: 0.875rem;
                  color: #475569;
                  line-height: 1.65;
                  margin-bottom: 1rem;
                  font-weight: 500;
                }
                .legal-content ul {
                  list-style-type: disc;
                  padding-left: 1.25rem;
                  margin-bottom: 1rem;
                }
                .legal-content li {
                  font-size: 0.875rem;
                  color: #475569;
                  line-height: 1.6;
                  margin-bottom: 0.35rem;
                  font-weight: 500;
                }
                @media (max-width: 640px) {
                  .legal-content h2 {
                    font-size: 1rem;
                  }
                  .legal-content p, .legal-content li {
                    font-size: 0.8125rem;
                  }
                }
              `}</style>
              
              <div 
                className="legal-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Important Disclaimer Notice */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#0F172A] uppercase tracking-wider">
                <AlertCircle className="size-4 text-[#E31837]" />
                <span>Binding Agreement Notice</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                By placing an order on Costplus100 or making an inquiry, you acknowledge that you have read, understood, and agree to be bound by these commercial Terms and Conditions.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
