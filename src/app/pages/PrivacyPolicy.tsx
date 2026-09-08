// Privacy Policy Page - Data protection policy with admin-editable content & mobile responsive styling
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Shield, Calendar, AlertCircle, ShieldCheck, Clock, ChevronRight, Mail, ArrowRight, Lock, EyeOff, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function PrivacyPolicy() {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch(`${API_URL}/legal/privacy-policy`, {
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
      console.error('Failed to load privacy policy:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
      <h2 id="sec-1">1. Introduction</h2>
      <p>Costplus100 ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our commercial equipment ordering services.</p>
      
      <h2 id="sec-2">2. Information We Collect</h2>
      <p>We collect personal information that you voluntarily provide when registering for an account, requesting commercial quotes, or placing equipment orders:</p>
      <ul>
        <li>Name, business name, and contact details (email, phone, delivery address)</li>
        <li>Billing and shipping information for warehouse dispatch</li>
        <li>Payment details (processed securely through PCI-DSS compliant eWay gateway)</li>
        <li>Purchase history and invoice records</li>
      </ul>
      
      <h2 id="sec-3">3. How We Use Your Information</h2>
      <p>We use the information we collect strictly to:</p>
      <ul>
        <li>Process and fulfill your commercial equipment orders</li>
        <li>Communicate with you regarding delivery tracking and invoice status</li>
        <li>Provide customer support and process warranty claims</li>
        <li>Prevent commercial fraud and enhance infrastructure security</li>
        <li>Comply with Australian tax and business record obligations</li>
      </ul>
      
      <h2 id="sec-4">4. Information Sharing & Third Parties</h2>
      <p>We do not sell, rent, or trade your personal information. Information is shared only with trusted commercial service providers:</p>
      <ul>
        <li>Official warehouse dispatch hubs (such as Nisbets Australia) for order fulfillment</li>
        <li>Payment gateway partners (eWay) for bank-grade transaction processing</li>
        <li>Freight and logistics courier partners for equipment delivery</li>
      </ul>
      
      <h2 id="sec-5">5. Data Security & Encryption</h2>
      <p>We implement enterprise-grade security measures to protect your commercial records:</p>
      <ul>
        <li>256-bit SSL/TLS encryption across all website interactions</li>
        <li>Strict access controls and encrypted cloud storage databases</li>
        <li>PCI-DSS Level 1 payment compliance</li>
      </ul>
      
      <h2 id="sec-6">6. Cookies & Web Tracking</h2>
      <p>We use cookies to maintain your shopping cart session, remember login preferences, and analyze anonymized site traffic performance.</p>
      
      <h2 id="sec-7">7. Your Privacy Rights</h2>
      <p>Under the Australian Privacy Act 1988, you have the right to request access to your personal information, request corrections, or request account deletion by emailing admin@costplus100.com.au.</p>
      
      <h2 id="sec-8">8. Complaints & OAIC Contact</h2>
      <p>If you believe we have breached the Australian Privacy Principles, please contact us directly. You also have the right to lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.</p>
    `;
  };

  const navItems = [
    { title: '1. Introduction', id: 'sec-1' },
    { title: '2. Information We Collect', id: 'sec-2' },
    { title: '3. How We Use Information', id: 'sec-3' },
    { title: '4. Information Sharing', id: 'sec-4' },
    { title: '5. Data Security & Encryption', id: 'sec-5' },
    { title: '6. Cookies & Tracking', id: 'sec-6' },
    { title: '7. Your Privacy Rights', id: 'sec-7' },
    { title: '8. Complaints & OAIC', id: 'sec-8' },
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
        title="Privacy Policy | Cost Plus 100 Catering Equipment"
        description="Review the privacy policy for Cost Plus 100. Learn how we protect your personal and commercial data in compliance with Australian Privacy Principles (APP)."
        canonical="https://costplus100.com.au/privacy-policy"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO HEADER (Full-Width Top Navbar Dark Navy bg-[#0F172A])
         ---------------------------------------------------- */}
      <section className="w-full bg-[#0F172A] text-white py-10 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
            DATA PRIVACY & SECURITY
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Your privacy and commercial data protection are fundamental to our transparent business operations.
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
              <span>APP Privacy Compliant</span>
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
                <Lock className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F172A]">256-Bit SSL Encryption</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  All customer transmissions are protected with bank-grade encryption algorithms.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-start gap-4 hover:border-[#E31837] transition-all">
              <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <EyeOff className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F172A]">Zero Data Selling</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  We strictly never sell or trade customer information to third-party advertisers.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-start gap-4 hover:border-[#E31837] transition-all">
              <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F172A]">eWay PCI-DSS Secure</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Card processing uses Level 1 PCI-DSS certified gateway infrastructure.
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

            {/* Quick Navigation Card */}
            <div className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 ${showMobileNav ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="size-4 text-[#E31837]" />
                  <span>Privacy Topics</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">8 Clauses</span>
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

            {/* Need Privacy Help Card */}
            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                <Mail className="size-4" />
                <span>Privacy Officer</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Have questions regarding your personal data or wish to request data access/deletion?
              </p>
              <Link to="/contact">
                <Button className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2">
                  <span>Contact Privacy Team</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Policy Content Showcase (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Australian Privacy Principles Compliance Box */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <ShieldCheck className="size-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Australian Privacy Principles (APP) Compliant</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Costplus100 strictly adheres to the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs), ensuring high standards of data governance.
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
                <span>Your Data Control Guarantee</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                You maintain complete control over your commercial information. For data access requests or privacy inquiries, contact our Australian Privacy Officer at admin@costplus100.com.au.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
