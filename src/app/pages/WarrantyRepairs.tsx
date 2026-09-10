// Warranty & Repairs Page - Admin-editable content, same pattern as TermsAndConditions
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ShieldCheck, Calendar, Clock, ChevronRight, Mail, ArrowRight, Menu, Wrench } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function WarrantyRepairs() {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch(`${API_URL}/legal/warranty-repairs`, {
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
      console.error('Failed to load warranty page:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => `
    <h2 id="sec-1">1. Manufacturer Warranty</h2>
    <p>All commercial equipment sold through Costplus100 is covered by the original manufacturer's warranty. Warranty periods vary by brand and product category — please refer to the documentation supplied with your equipment or contact us to confirm the warranty period for a specific product.</p>
    <ul>
      <li>Polar Refrigeration: 2-year parts and labour warranty</li>
      <li>Simco Equipment: 12-month parts and labour warranty</li>
      <li>Thor Cooking Equipment: 12-month parts and labour warranty</li>
      <li>Other brands: as specified by the manufacturer</li>
    </ul>

    <h2 id="sec-2">2. What the Warranty Covers</h2>
    <p>Manufacturer warranties generally cover defects in materials and workmanship under normal commercial use. This includes:</p>
    <ul>
      <li>Faulty components or parts supplied by the manufacturer</li>
      <li>Defects present at the time of delivery</li>
      <li>Failures resulting from manufacturing errors</li>
    </ul>

    <h2 id="sec-3">3. What the Warranty Does Not Cover</h2>
    <p>The following are typically excluded from manufacturer warranty coverage:</p>
    <ul>
      <li>Damage caused by misuse, neglect, or improper installation</li>
      <li>Normal wear and tear (seals, filters, gaskets, bulbs)</li>
      <li>Damage caused by using the equipment outside its intended purpose</li>
      <li>Repairs carried out by unauthorised service agents</li>
      <li>Cosmetic damage that does not affect functionality</li>
      <li>Damage caused by power surges or incorrect voltage supply</li>
    </ul>

    <h2 id="sec-4">4. Australian Consumer Law</h2>
    <p>In addition to manufacturer warranty, your equipment may be covered by guarantees under the Australian Consumer Law (ACL). These guarantees cannot be excluded and apply independently of any manufacturer warranty. Under the ACL, you are entitled to a repair, replacement, or refund for a major failure, and compensation for reasonably foreseeable loss or damage.</p>

    <h2 id="sec-5">5. How to Make a Warranty Claim</h2>
    <p>To lodge a warranty claim, please follow these steps:</p>
    <ol>
      <li>Contact our support team at <strong>info@costplus100.com.au</strong> or call <strong>1800 151 624</strong></li>
      <li>Provide your order number, product model, and a description of the fault</li>
      <li>Attach photos or video clearly showing the defect or issue</li>
      <li>Our team will assess the claim and advise on next steps within 2 business days</li>
    </ol>
    <p><strong>Important:</strong> Do not attempt to repair the equipment yourself or use an unauthorised technician — this may void your warranty.</p>

    <h2 id="sec-6">6. Repairs</h2>
    <p>For equipment that is out of warranty or requires repairs not covered under warranty, Costplus100 can arrange service through authorised repair agents. Labour and parts costs will be quoted before any work is carried out. We work with manufacturer-approved service partners Australia-wide to minimise downtime for your business.</p>

    <h2 id="sec-7">7. Freight & Warranty Service</h2>
    <p>For warranty repairs requiring the equipment to be returned:</p>
    <ul>
      <li>Inbound freight (to service agent) is covered by Costplus100 for valid warranty claims</li>
      <li>Return freight (to customer) is covered by Costplus100 upon completion of warranty repair</li>
      <li>For out-of-warranty repairs, freight costs are the customer's responsibility</li>
    </ul>

    <h2 id="sec-8">8. Contact Us</h2>
    <p>For warranty enquiries or to book a repair, please reach out:</p>
    <ul>
      <li>Email: info@costplus100.com.au</li>
      <li>Phone: 1800 151 624</li>
      <li>Business Hours: Monday–Friday, 9am–5pm AEST</li>
    </ul>
  `;

  const navItems = [
    { title: '1. Manufacturer Warranty', id: 'sec-1' },
    { title: '2. What Is Covered', id: 'sec-2' },
    { title: '3. What Is Not Covered', id: 'sec-3' },
    { title: '4. Australian Consumer Law', id: 'sec-4' },
    { title: '5. How to Make a Claim', id: 'sec-5' },
    { title: '6. Repairs', id: 'sec-6' },
    { title: '7. Freight & Service', id: 'sec-7' },
    { title: '8. Contact Us', id: 'sec-8' },
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
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Warranty Information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white pb-20">
      <SEOHead
        title="Warranty & Repairs | Cost Plus 100 Catering Equipment"
        description="Understand the manufacturer warranty and repair process for commercial catering equipment purchased from Cost Plus 100. Australia-wide service support."
        canonical="https://costplus100.com.au/warranty-repairs"
      />

      {/* HERO */}
      <section className="w-full bg-[#0F172A] text-white py-10 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
            PRODUCT SUPPORT
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Warranty &amp; Repairs
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Manufacturer warranty coverage, repair services, and how to lodge a claim for your commercial equipment.
          </p>
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
              <span>ACL Protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">

            {/* Mobile toggle */}
            <div className="lg:hidden bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Wrench className="size-4 text-[#E31837]" />
                <span>Jump to Section</span>
              </span>
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="text-xs font-bold text-[#E31837] bg-red-50 px-3 py-1 rounded-lg border border-red-100 flex items-center gap-1 cursor-pointer"
              >
                <span>{showMobileNav ? 'Hide' : 'Show'}</span>
                <ChevronRight className={`size-3.5 transition-transform ${showMobileNav ? 'rotate-90' : ''}`} />
              </button>
            </div>

            <div className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 ${showMobileNav ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="size-4 text-[#E31837]" />
                  <span>Quick Navigation</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">8 Sections</span>
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

            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                <Mail className="size-4" />
                <span>Lodge a Claim</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Have a warranty issue or need a repair booked? Our team responds within 2 business days.
              </p>
              <Link to="/contact">
                <Button className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2">
                  <span>Contact Our Team</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8 space-y-6">
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
                .legal-content h2:first-child { margin-top: 0; }
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
                .legal-content ul { list-style-type: disc; }
                .legal-content ol { list-style-type: decimal; }
                .legal-content li {
                  font-size: 0.875rem;
                  color: #475569;
                  line-height: 1.6;
                  margin-bottom: 0.35rem;
                  font-weight: 500;
                }
                @media (max-width: 640px) {
                  .legal-content h2 { font-size: 1rem; }
                  .legal-content p, .legal-content li { font-size: 0.8125rem; }
                }
              `}</style>
              <div className="legal-content" dangerouslySetInnerHTML={{ __html: content }} />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#0F172A] uppercase tracking-wider">
                <ShieldCheck className="size-4 text-[#E31837]" />
                <span>Your Consumer Rights</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Our products come with guarantees that cannot be excluded under the Australian Consumer Law. You are entitled to a replacement or refund for a major failure and compensation for any other reasonably foreseeable loss or damage.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
