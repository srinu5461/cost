// Delivery Information Page - Formatted matching Terms & Conditions, Privacy Policy & Return Refund Policy design system
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Truck, Calendar, AlertCircle, Loader2, Clock, ShieldCheck, MapPin, ChevronRight, FileText, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function DeliveryInformation() {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const navItems = [
    { title: '1. Store Pickup Available', id: 'sec-1' },
    { title: '2. Metro Areas Delivery', id: 'sec-2' },
    { title: '3. Regional & Remote Rates', id: 'sec-3' },
    { title: '4. Delivery & Kerbside Rules', id: 'sec-4' },
    { title: '5. Returns & Extended Lead Times', id: 'sec-5' },
  ];

  useEffect(() => {
    loadContent();
  }, []);

  const wrapTablesForMobile = (html: string) => {
    if (!html) return '';

    // Robustly strip all inline style, bgcolor, align, width, height attributes regardless of single/double quotes
    let clean = html
      .replace(/\s*style\s*=\s*(["'])[\s\S]*?\1/gi, '')
      .replace(/\s*style\s*=\s*[^ >]*/gi, '')
      .replace(/\s*bgcolor\s*=\s*(["'])[\s\S]*?\1/gi, '')
      .replace(/\s*bgcolor\s*=\s*[^ >]*/gi, '')
      .replace(/\s*width\s*=\s*(["'])[\s\S]*?\1/gi, '')
      .replace(/\s*height\s*=\s*(["'])[\s\S]*?\1/gi, '');

    // Colorize region header paragraphs like "New South Wales - Regional"
    clean = clean.replace(/<p[^>]*>\s*(<strong>)?\s*((New South Wales|Victoria|Queensland|Western Australia|South Australia|Tasmania|Northern Territory)[^<]*)(<\/strong>)?\s*<\/p>/gi, (match, p1, p2) => {
      return `<div class="region-badge-pill">${p2}</div>`;
    });

    // Colorize location cell text and prices into vibrant rounded badges
    clean = clean
      .replace(/<td>\s*(SYDNEY METRO)\s*<\/td>/gi, '<td><span class="loc-badge loc-amber">$1</span></td>')
      .replace(/<td>\s*(MELBOURNE METRO)\s*<\/td>/gi, '<td><span class="loc-badge loc-rose">$1</span></td>')
      .replace(/<td>\s*(BRISBANE METRO)\s*<\/td>/gi, '<td><span class="loc-badge loc-teal">$1</span></td>')
      .replace(/<td>\s*(PERTH &amp; ADELAIDE METRO|PERTH & ADELAIDE METRO)\s*<\/td>/gi, '<td><span class="loc-badge loc-sky">$1</span></td>')
      .replace(/<td>\s*(Regional Towns)\s*<\/td>/gi, '<td><span class="loc-badge loc-amber">$1</span></td>')
      .replace(/<td>\s*(Regional Areas)\s*<\/td>/gi, '<td><span class="loc-badge loc-indigo">$1</span></td>')
      .replace(/<td>\s*(Remote &amp; Interstate|Remote & Interstate)\s*<\/td>/gi, '<td><span class="loc-badge loc-purple">$1</span></td>')
      .replace(/<td>\s*(\$[0-9]+)\s*<\/td>/gi, '<td><span class="badge-price">$1</span></td>')
      .replace(/<td>\s*(FREE)\s*<\/td>/gi, '<td><span class="badge-free">$1</span></td>');

    // Wrap table tags in responsive scroll container cleanly without leaving residual tag attributes
    return clean
      .replace(/<table[^>]*>/gi, '<div class="table-responsive-wrapper"><table class="delivery-table">')
      .replace(/<\/table>/gi, '</table></div>');
  };

  const loadContent = async () => {
    try {
      const response = await fetch(`${API_URL}/legal/delivery-information`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContent(wrapTablesForMobile(data.content || getDefaultContent()));
        setLastUpdated(data.lastUpdated || new Date().toISOString());
      } else {
        setContent(wrapTablesForMobile(getDefaultContent()));
      }
    } catch (error) {
      console.error('Failed to load delivery information:', error);
      setContent(wrapTablesForMobile(getDefaultContent()));
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowMobileNav(false);
  };

  const getDefaultContent = () => {
    return `
      <div id="sec-1" class="delivery-sec-header">
        <h2 class="text-base sm:text-lg font-black text-[#0F172A]">
          1. Store Pickup Available
        </h2>
      </div>
      <p>
        You can pick up your ordered stock free of charge at <strong>Nisbets warehouse hubs</strong> across Australia in Sydney, Melbourne, Brisbane, Perth, and Adelaide. Once your order is processed, warehouse collection details and pickup codes are issued directly to your email.
      </p>

      <div class="delivery-callout-blue">
        <div class="font-black text-[#0F172A] text-xs sm:text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
          <span>Store Pickup Locations:</span>
        </div>
        <p class="text-xs text-slate-600 font-medium leading-relaxed">
          Available at Nisbets hubs in Sydney, Melbourne, Brisbane, Perth, and Adelaide. Select pickup or contact us upon ordering for instant dispatch codes.
        </p>
      </div>

      <div id="sec-2" class="delivery-sec-header">
        <h2 class="text-base sm:text-lg font-black text-[#0F172A]">
          2. Metro Areas Delivery Matrix
        </h2>
      </div>
      <p>
        Items are dispatched directly by official brand suppliers, so delivery times vary. Small item satchel rates are automatically calculated at checkout.
      </p>

      <!-- Metro Table Container (Scrollable & Responsive) -->
      <div class="table-responsive-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Delivery Times</th>
              <th>Under $300</th>
              <th>Over $300+ (Small Items)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="loc-badge loc-amber">SYDNEY METRO</span></td>
              <td>1–2 Days</td>
              <td><span class="badge-price">$30</span></td>
              <td><span class="badge-free">FREE</span></td>
            </tr>
            <tr>
              <td><span class="loc-badge loc-rose">MELBOURNE METRO</span></td>
              <td>1–2 Days</td>
              <td><span class="badge-price">$30</span></td>
              <td><span class="badge-free">FREE</span></td>
            </tr>
            <tr>
              <td><span class="loc-badge loc-teal">BRISBANE METRO</span></td>
              <td>1–2 Days</td>
              <td><span class="badge-price">$30</span></td>
              <td><span class="badge-free">FREE</span></td>
            </tr>
            <tr>
              <td><span class="loc-badge loc-sky">PERTH & ADELAIDE METRO</span></td>
              <td>2–4 Days</td>
              <td><span class="badge-price">$45</span></td>
              <td><span class="badge-free">FREE</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div id="sec-3" class="delivery-sec-header">
        <h2 class="text-base sm:text-lg font-black text-[#0F172A]">
          3. Regional & Remote Freight Schedule
        </h2>
      </div>
      <p>
        Delivery times and charges vary by location. Below is the regional shipping schedule for NSW, Victoria, Queensland, and Western Australia:
      </p>

      <!-- Regional Table Container -->
      <div class="table-responsive-wrapper">
        <table class="delivery-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Delivery Times</th>
              <th>Under $300</th>
              <th>$300 – $700</th>
              <th>Over $700</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="loc-badge loc-indigo">Regional Towns</span></td>
              <td>1–2 Days</td>
              <td><span class="badge-price">$30</span></td>
              <td><span class="badge-free">FREE</span></td>
              <td><span class="badge-free">FREE</span></td>
            </tr>
            <tr>
              <td><span class="loc-badge loc-purple">Regional Areas</span></td>
              <td>2–5 Days</td>
              <td><span class="badge-price">$60</span></td>
              <td><span class="badge-price">$30</span></td>
              <td><span class="badge-free">FREE</span></td>
            </tr>
            <tr>
              <td><span class="loc-badge loc-slate">Remote & Interstate</span></td>
              <td>3–7 Days</td>
              <td colspan="3" class="text-center font-bold text-slate-500">Contact Us for Custom Freight Quote</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div id="sec-4" class="delivery-sec-header">
        <h2 class="text-base sm:text-lg font-black text-[#0F172A]">
          4. Delivery Guidelines & Kerbside Rules
        </h2>
      </div>
      <p>
        Please review the following operational rules regarding heavy equipment, commercial refrigeration, and loading dock access:
      </p>
      <ul>
        <li>For large items, a supplementary delivery charge may apply depending on location.</li>
        <li><strong>Delivery hours are between 9:00 AM and 5:00 PM (weekdays only).</strong></li>
        <li>All delivery prices shown on quotes are GST exclusive unless stated otherwise.</li>
        <li>Freight times offered are to be used as a guide only; Costplus100 will not be held responsible for carrier transit delays.</li>
        <li>Any items on backorder will be dispatched together when all items arrive in our distribution hub.</li>
      </ul>

      <div class="delivery-callout-amber">
        <div class="font-black text-amber-900 text-xs sm:text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
          <span>Kerbside Delivery Policy:</span>
        </div>
        <p class="text-xs text-amber-800 font-medium leading-relaxed">
          Delivery of cooking machines, refrigeration, flat-pack items, and heavy furniture will be made to kerbside locations only. Drivers cannot negotiate stairs or lifts. Customers are responsible for ensuring that products ordered fit through doorways.
        </p>
      </div>

      <div class="delivery-callout-blue">
        <div class="font-black text-blue-900 text-xs sm:text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
          <span>Commercial Refrigeration Upright Transport:</span>
        </div>
        <p class="text-xs text-blue-800 font-medium leading-relaxed">
          All refrigeration equipment must be transported in an upright position. If collecting via warehouse pickup, ensure you have an adequate vehicle to transport upright.
        </p>
      </div>

      <div id="sec-5" class="delivery-sec-header">
        <h2 class="text-base sm:text-lg font-black text-[#0F172A]">
          5. Returns & Extended Delivery Lead Times
        </h2>
      </div>
      <p>
        Goods delivered may be returned for a refund, exchange, or replacement within 30 days provided they are returned unused, in saleable condition, and in original packaging under Australian Consumer Law.
      </p>
      <p>
        Certain heavy or custom equipment items have an extended delivery lead time of 1–2 additional days. For remote or offshore deliveries, please contact our support team.
      </p>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#E31837]" />
          <span className="text-lg font-bold text-slate-700">Loading delivery information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white pb-20">
      <SEOHead
        title="Delivery & Returns | Cost Plus 100 Catering Equipment"
        description="Learn about Cost Plus 100 shipping rates, Nisbets store pickup locations in Sydney, Melbourne, Brisbane, Perth & Adelaide, and Australia-wide commercial freight."
        canonical="https://costplus100.com.au/delivery-information"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO HEADER (Full-Width Top Navbar Dark Navy bg-[#0F172A])
         ---------------------------------------------------- */}
      <section className="w-full bg-[#0F172A] text-white py-10 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
            AUSTRALIA-WIDE FREIGHT & PICKUPS
            <span className="w-6 sm:w-8 h-0.5 bg-white/80"></span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Delivery & Returns
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Fast, reliable delivery across Australia. Learn about our shipping times, costs, and Nisbets store pickup options.
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
              <MapPin className="size-3.5 text-blue-400" />
              <span>Nisbets Store Pickups</span>
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="size-11 rounded-xl bg-red-50 text-[#E31837] flex items-center justify-center shrink-0 border border-red-100">
                <MapPin className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#0F172A]">Nisbets Store Pickups</h3>
                <p className="text-xs text-slate-500 font-medium">Free collection in SYD, MEL, BNE, PER, ADL</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Truck className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#0F172A]">Express Metro Dispatch</h3>
                <p className="text-xs text-slate-500 font-medium">1-2 business days fast delivery</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
              <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#0F172A]">COPE & StarTrack Partners</h3>
                <p className="text-xs text-slate-500 font-medium">Insured commercial freight transport</p>
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
                  <FileText className="size-4 text-[#E31837]" />
                  <span>Quick Navigation</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">5 Topics</span>
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

            {/* Support Box Card */}
            <div className="bg-[#0F172A] text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
                <Mail className="size-4" />
                <span>Freight Assistance</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Need help tracking your order or calculating heavy equipment delivery for your commercial venue?
              </p>
              <Link to="/contact">
                <Button className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2">
                  <span>Contact Logistics Team</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Content Showcase (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* AUD & GST Notice Card */}
            <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
              <CheckCircle2 className="size-5 text-[#E31837] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider">Nisbets Warehouse Pickups Included</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  You can collect your ordered stock free of charge from Nisbets store hubs nationwide. Simply select pickup or contact us upon placing your order.
                </p>
              </div>
            </div>

            {/* Content Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-8 shadow-2xs space-y-6">
              <style>{`
                .legal-content h2 {
                  font-size: 1.125rem;
                  font-weight: 900;
                  color: #0F172A;
                  margin-top: 1.75rem;
                  margin-bottom: 0.75rem;
                  padding: 0.5rem 0.75rem;
                  background-color: #F8FAFC;
                  border-left: 4px solid #E31837;
                  border-radius: 0 0.5rem 0.5rem 0;
                  display: block;
                  scroll-margin-top: 6rem;
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
                .table-responsive-wrapper {
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow-x: auto !important;
                  -webkit-overflow-scrolling: touch !important;
                  margin-top: 1rem !important;
                  margin-bottom: 1.5rem !important;
                  border-radius: 0.75rem !important;
                  border: 1px solid #E2E8F0 !important;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.04) !important;
                  display: block !important;
                }
                .delivery-table, .legal-content table {
                  width: 100% !important;
                  min-width: 540px !important;
                  border-collapse: separate !important;
                  border-spacing: 0 !important;
                  font-size: 0.8125rem !important;
                }
                .delivery-table th, .legal-content th {
                  background-color: #0F172A !important;
                  color: #FFFFFF !important;
                  font-weight: 800 !important;
                  font-size: 0.75rem !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.04em !important;
                  padding: 0.65rem 0.75rem !important;
                  border: none !important;
                  border-bottom: 2px solid #334155 !important;
                  text-align: left !important;
                  white-space: nowrap !important;
                }
                .delivery-table td, .legal-content td {
                  padding: 0.65rem 0.75rem !important;
                  border: none !important;
                  border-bottom: 1px solid #E2E8F0 !important;
                  color: #334155 !important;
                  font-weight: 600 !important;
                  font-size: 0.8125rem !important;
                  white-space: nowrap !important;
                }
                .delivery-table tbody tr:hover, .legal-content tr:hover {
                  background-color: #F8FAFC !important;
                }
                .badge-price {
                  display: inline-block;
                  font-weight: 800;
                  color: #0F172A;
                  background-color: #F1F5F9;
                  border: 1px solid #E2E8F0;
                  padding: 0.15rem 0.6rem;
                  border-radius: 9999px;
                }
                .badge-free {
                  display: inline-block;
                  font-weight: 800;
                  color: #15803D;
                  background-color: #DCFCE7;
                  border: 1px solid #BBF7D0;
                  padding: 0.15rem 0.6rem;
                  border-radius: 9999px;
                }
                .loc-badge {
                  display: inline-block;
                  font-weight: 800;
                  font-size: 0.75rem;
                  padding: 0.25rem 0.65rem;
                  border-radius: 0.5rem;
                  border: 1px solid transparent;
                  letter-spacing: 0.02em;
                  white-space: nowrap;
                }
                .loc-amber { background-color: #FEF3C7; color: #78350F; border-color: #FDE68A; }
                .loc-rose { background-color: #FFE4E6; color: #9F1239; border-color: #FECDD3; }
                .loc-teal { background-color: #CCFBF1; color: #115E59; border-color: #99F6E4; }
                .loc-sky { background-color: #E0F2FE; color: #075985; border-color: #BAE6FD; }
                .loc-indigo { background-color: #E0E7FF; color: #3730A3; border-color: #C7D2FE; }
                .loc-purple { background-color: #F3E8FF; color: #6B21A8; border-color: #E9D5FF; }
                .loc-slate { background-color: #F1F5F9; color: #334155; border-color: #CBD5E1; }
                .region-badge-pill {
                  display: inline-block;
                  font-size: 0.8125rem !important;
                  font-weight: 800 !important;
                  color: #78350F !important;
                  background-color: #FEF3C7 !important;
                  border: 1px solid #FDE68A !important;
                  padding: 0.4rem 0.85rem !important;
                  border-radius: 0.75rem !important;
                  margin-top: 1rem !important;
                  margin-bottom: 0.5rem !important;
                }
                .delivery-callout-amber {
                  background-color: #FFFBEB;
                  border-left: 4px solid #F59E0B;
                  border-radius: 0.75rem;
                  padding: 1rem 1.25rem;
                  margin-top: 1.25rem;
                  margin-bottom: 1.25rem;
                  border-top: 1px solid #FEF3C7;
                  border-right: 1px solid #FEF3C7;
                  border-bottom: 1px solid #FEF3C7;
                }
                .delivery-callout-blue {
                  background-color: #EFF6FF;
                  border-left: 4px solid #3B82F6;
                  border-radius: 0.75rem;
                  padding: 1rem 1.25rem;
                  margin-top: 1.25rem;
                  margin-bottom: 1.25rem;
                  border-top: 1px solid #DBEAFE;
                  border-right: 1px solid #DBEAFE;
                  border-bottom: 1px solid #DBEAFE;
                }
                @media (max-width: 640px) {
                  .legal-content h2 {
                    font-size: 0.9375rem !important;
                    padding: 0.4rem 0.6rem !important;
                  }
                  .legal-content p, .legal-content li {
                    font-size: 0.775rem !important;
                    line-height: 1.5 !important;
                  }
                  .table-responsive-wrapper {
                    border-radius: 0.6rem !important;
                  }
                  .delivery-table, .legal-content table {
                    font-size: 0.725rem !important;
                    min-width: 500px !important;
                  }
                  .delivery-table th, .legal-content th {
                    font-size: 0.6875rem !important;
                    padding: 0.45rem 0.55rem !important;
                    letter-spacing: 0.02em !important;
                  }
                  .delivery-table td, .legal-content td {
                    font-size: 0.725rem !important;
                    padding: 0.45rem 0.55rem !important;
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
                <span>Commercial Freight Policy Disclaimer</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Freight times are estimates provided as a guide only. Costplus100 partners with specialized heavy equipment hauliers to ensure safe delivery across Australia.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DeliveryInformation;
