// Return & Refund Policy Page - Customer return policy with admin-editable content & mobile responsive styling
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { RefreshCw, Calendar, AlertCircle, CheckCircle2, ShieldCheck, Clock, ChevronRight, Mail, ArrowRight, Truck, RotateCcw } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function ReturnRefundPolicy() {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch(`${API_URL}/legal/return-refund-policy`, {
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
      console.error('Failed to load return policy:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
      <h2 id="sec-1">1. Our Commercial Guarantee</h2>
      <p>At Costplus100, we stand behind the quality of our commercial catering equipment. If you are not completely satisfied with your purchase, we are here to assist you with return authorization under Australian law.</p>
      
      <h2 id="sec-2">2. 30-Day Commercial Return Policy</h2>
      <p>We offer a 30-day return window on standard inventory items from the date of delivery. To be eligible for a return:</p>
      <ul>
        <li>Items must be in original, unused, and uninstalled commercial condition</li>
        <li>Original factory packaging and crate protection must be intact and undamaged</li>
        <li>All accessories, spec sheets, user manuals, and components must be included</li>
        <li>Proof of purchase (tax invoice or order confirmation) must be provided</li>
      </ul>
      
      <h2 id="sec-3">3. Special Order & Non-Returnable Items</h2>
      <p>Certain custom equipment cannot be returned due to importer specifications:</p>
      <ul>
        <li>Custom-built stainless steel fabrication or special factory orders</li>
        <li>Items marked as "Final Clearance" or "Non-Returnable"</li>
        <li>Equipment that has been installed, plumbed, or wired into commercial premises</li>
        <li>Perishable consumables or chemical products that have been opened</li>
      </ul>
      
      <h2 id="sec-4">4. How to Request Return Authorization</h2>
      <p>To initiate a return, please follow our required commercial procedure:</p>
      <ol>
        <li>Contact our service team at <strong>admin@costplus100.com.au</strong> or call <strong>(08) 6165 8444</strong></li>
        <li>Provide your tax invoice number and photos of the unboxed/boxed equipment</li>
        <li>Receive your formal Return Goods Authorization (RGA) number and warehouse hub address</li>
        <li>Securely palletize and dispatch the item to the designated collection point</li>
      </ol>
      <p><strong>Note:</strong> Goods returned without a valid RGA number cannot be accepted at Nisbets warehouse locations.</p>
      
      <h2 id="sec-5">5. Fast Priority Refund Processing</h2>
      <p>Upon receipt and technical inspection at our distribution warehouse:</p>
      <ul>
        <li>Approved refunds are processed within 5-7 business days</li>
        <li>Refunds are credited directly to your original payment method (Credit Card / Bank Transfer)</li>
        <li>You will receive an automated email confirmation upon refund completion</li>
      </ul>
      
      <h2 id="sec-6">6. Freight & Return Shipping Costs</h2>
      <p>Freight responsibility depends on the reason for return:</p>
      <ul>
        <li><strong>Defective or Transit Damaged:</strong> Costplus100 covers 100% of pickup freight and replacement shipping</li>
        <li><strong>Incorrect Item Shipped:</strong> We arrange priority collection and dispatch the correct item at zero charge</li>
        <li><strong>Commercial Change of Mind:</strong> Customer is responsible for return freight logistics to warehouse hub</li>
      </ul>
      
      <h2 id="sec-7">7. Manufacturer Warranty Claims</h2>
      <p>Every commercial machine sold by Costplus100 comes backed by full manufacturer factory warranty (typically 1 to 2 years parts & labor):</p>
      <ul>
        <li>We coordinate directly with official Australian brand service technicians on your behalf</li>
        <li>On-site technician dispatch is available across metro Sydney, Melbourne, Brisbane, Perth, and Adelaide</li>
      </ul>
      
      <h2 id="sec-8">8. Australian Consumer Law (ACL) Compliance</h2>
      <p>Our goods come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a replacement or refund for a major failure and compensation for any other reasonably foreseeable loss or damage. You are also entitled to have the goods repaired or replaced if the goods fail to be of acceptable quality and the failure does not amount to a major failure.</p>
    `;
  };

  const navItems = [
    { title: '1. Commercial Guarantee', id: 'sec-1' },
    { title: '2. 30-Day Return Policy', id: 'sec-2' },
    { title: '3. Special & Non-Returnable', id: 'sec-3' },
    { title: '4. Return Authorization', id: 'sec-4' },
    { title: '5. Refund Processing', id: 'sec-5' },
    { title: '6. Freight & Logistics', id: 'sec-6' },
    { title: '7. Manufacturer Warranty', id: 'sec-7' },
    { title: '8. Australian Consumer Law', id: 'sec-8' },
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
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Policy Documentation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white pb-20">
      <SEOHead
        title="Return & Refund Policy | Cost Plus 100 Catering Equipment"
        description="Review the commercial return and refund policy for Cost Plus 100. 30-day returns, fast refunds, manufacturer warranty coverage, and Australian Consumer Law guarantees."
        canonical="https://costplus100.com.au/return-refund-policy"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO HEADER (Full-Width Top Navbar Dark Navy bg-[#0F172A])
         ---------------------------------------------------- */}
      <section className="w-full bg-[#0F172A] text-white py-10 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
            CUSTOMER PROTECTION & SATISFACTION
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Return & Refund Policy
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Hassle-free commercial equipment returns, factory warranty assistance, and transparent refund terms.
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
              <span>4 Min Read</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-blue-400" />
              <span>ACL Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 2: HIGHLIGHT CARDS BAR (3 Pillars)
         ---------------------------------------------------- */}
      <section className="w-full bg-slate-50 border-b border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-start gap-4 hover:border-[#E31837] transition-all">
              <div className="size-11 rounded-xl bg-red-50 text-[#E31837] flex items-center justify-center shrink-0 border border-red-100">
                <RotateCcw className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F172A]">30-Day Commercial Returns</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Return unused equipment in original packaging with authorization.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-start gap-4 hover:border-[#E31837] transition-all">
              <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Fast Priority Refunds</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Processed within 5-7 business days directly to original payment method.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-start gap-4 hover:border-[#E31837] transition-all">
              <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Truck className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Transit & Defect Cover</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Damaged or defective items replaced with 100% free return freight.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 3: MAIN CONTENT CONTAINER (2 Columns Layout)
         ---------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left Column: Quick Navigation Sidebar (4 Cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            
            {/* Mobile Nav Toggle */}
            <div className="lg:hidden bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="size-4 text-[#E31837]" />
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

            {/* Quick Navigation Card */}
            <div className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 ${showMobileNav ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="size-4 text-[#E31837]" />
                  <span>Policy Topics</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">8 Topics</span>
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

            {/* Need Return Help Card */}
            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                <Mail className="size-4" />
                <span>Return Support</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Need to submit a Return Authorization (RGA) or report damaged stock?
              </p>
              <Link to="/contact">
                <Button className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2">
                  <span>Contact Support Team</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Policy Content Showcase (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Australian Consumer Law Compliance Box */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Australian Consumer Law (ACL) Protected</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  All equipment purchases at Costplus100 come with statutory consumer guarantees under Australian Consumer Law. Your rights to repair, replacement, or refund for major failures are fully protected.
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
                .legal-content ul, .legal-content ol {
                  padding-left: 1.25rem;
                  margin-bottom: 1rem;
                }
                .legal-content ul {
                  list-style-type: disc;
                }
                .legal-content ol {
                  list-style-type: decimal;
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

            {/* Important Contact Notice */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#0F172A] uppercase tracking-wider">
                <AlertCircle className="size-4 text-[#E31837]" />
                <span>Return Authorization Requirement</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please ensure you contact customer support prior to shipping any goods back. Unauthorized returns without an RGA number cannot be accepted at warehouse hubs.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
