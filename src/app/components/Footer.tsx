import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useCMS } from '../context/CMSContext';
import { QuoteModal } from './QuoteModal';
import { categoryToSlug } from '../utils/slugify';
import { buildCategoryTree } from '../utils/categoryTree';
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Headphones,
  Truck,
  Award,
  ChevronRight,
  Lock,
  FileText
} from 'lucide-react';
import { SquareLogoWhite } from './SquareLogo';

// COPE Sensitive Freight Logo
function COPELogo({ className = "h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 203" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <path d="M0 50 L30 0 L380 0 L414 50 L380 100 L30 100 Z" fill="#D72027" />
      <rect x="105" y="10" width="3" height="80" fill="white" />
      <rect x="175" y="10" width="3" height="80" fill="white" />
      <rect x="245" y="10" width="3" height="80" fill="white" />
      <text x="67" y="68" fontSize="54" fontWeight="900" fill="white" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">C</text>
      <text x="140" y="68" fontSize="54" fontWeight="900" fill="white" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">O</text>
      <text x="210" y="68" fontSize="54" fontWeight="900" fill="white" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">P</text>
      <text x="280" y="68" fontSize="54" fontWeight="900" fill="white" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">E</text>
      <text x="300" y="150" fontSize="40" fontWeight="900" fill="#1A1A1A" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" letterSpacing="2">SENSITIVE FREIGHT</text>
    </svg>
  );
}

// StarTrack Logo
function StarTrackLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <circle cx="60" cy="60" r="45" fill="#D72027" />
      <path d="M60 15 A45 45 0 0 1 60 105 L60 60 Z" fill="white" />
      <text x="120" y="62" fontSize="38" fontWeight="900" fill="#003F7F" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1">STAR</text>
      <text x="220" y="62" fontSize="38" fontWeight="900" fill="#00AEEF" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1">TRACK</text>
    </svg>
  );
}

// Brand Logo Component using darklogo.png
function BrandLogo() {
  return (
    <Link to="/" className="inline-block">
      <img
        src="/logos/darklogo.png"
        alt="Costplus100 Logo"
        className="h-11 sm:h-13 w-auto object-contain"
      />
    </Link>
  );
}

// Payment Badges
function VisaLogo() {
  return (
    <div className="bg-white px-2.5 py-1 rounded-md flex items-center justify-center shadow-xs h-7">
      <span className="font-black text-xs text-[#1A1F71] italic tracking-tight">VISA</span>
    </div>
  );
}

function MastercardLogo() {
  return (
    <div className="bg-white px-2.5 py-1 rounded-md flex items-center justify-center shadow-xs h-7 gap-0.5">
      <div className="size-3.5 rounded-full bg-[#EB001B]" />
      <div className="size-3.5 rounded-full bg-[#F79E1B] -ml-2 opacity-90" />
    </div>
  );
}

function AmexLogo() {
  return (
    <div className="bg-[#006FCF] px-2 py-1 rounded-md flex items-center justify-center shadow-xs h-7">
      <span className="font-black text-[10px] text-white tracking-tighter">AMEX</span>
    </div>
  );
}

function ApplePayLogo() {
  return (
    <div className="bg-white px-2.5 py-1 rounded-md flex items-center justify-center shadow-xs h-7">
      <span className="font-bold text-xs text-black tracking-tight flex items-center gap-0.5">
        <span className="text-sm leading-none"></span>Pay
      </span>
    </div>
  );
}

function GooglePayLogo() {
  return (
    <div className="bg-white px-2.5 py-1 rounded-md flex items-center justify-center shadow-xs h-7">
      <span className="font-bold text-xs tracking-tight flex items-center">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#5F6368] ml-0.5">Pay</span>
      </span>
    </div>
  );
}

function PaypalLogo() {
  return (
    <div className="bg-white px-2.5 py-1 rounded-md flex items-center justify-center shadow-xs h-7">
      <span className="font-black text-xs text-[#003087] italic tracking-tighter">
        Pay<span className="text-[#0079C1]">Pal</span>
      </span>
    </div>
  );
}

export function Footer() {
  let data;
  try {
    const cms = useCMS();
    data = cms.data;
  } catch (e) {
    data = {
      footer: {
        about: 'Your trusted partner for professional catering equipment. We provide commercial-grade products from leading brands.',
        email: 'info@costplus100.com.au',
        phone: '1800 151 624',
        address: '5/14 Latham Street, Botany NSW 2019, Australia',
        socialMedia: {},
      },
    };
  }

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
const { footer } = data;
const builtCategoryTree = buildCategoryTree(data.categoryTree || []);
const FOOTER_CATEGORY_NAMES = [
  'refrigeration',
  'simco equipment',
  'commercial kitchen machines',
  'kitchenware',
];
const topCategories = FOOTER_CATEGORY_NAMES
  .map(name => builtCategoryTree.find((c: any) => c.name?.toLowerCase().includes(name)))
  .filter(Boolean)
  .slice(0, 5);
    return (
    <footer className="bg-[#0B1220] text-slate-300 w-full font-sans border-t border-slate-800/80">

      {/* ── PRE-FOOTER PROMO BANNER (HOMEPAGE ONLY) ── */}
      {isHomePage && (
        <div className="w-full relative overflow-hidden py-6 sm:py-8 flex items-center justify-center border-b border-slate-800/80 bg-[#070D18]">
          {/* Background Image with Light Transparent Gradient Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/prefooterkitchen.png"
              alt="Commercial Kitchen Background"
              className="w-full h-full object-cover opacity-70 filter brightness-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070D18]/65 via-[#070D18]/35 to-[#070D18]/65" />
          </div>

          {/* Content Container */}
          <div className="max-w-4xl mx-auto px-4 text-center z-10 relative flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-6 h-[1.5px] bg-[#E31837]" />
              <span className="text-[#E31837] text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">
                EQUIPPED FOR EXCELLENCE. BUILT FOR YOU.
              </span>
              <span className="w-6 h-[1.5px] bg-[#E31837]" />
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-tight mb-2">
              Everything Your Kitchen Needs, <span className="text-[#E31837]">All in One Place</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-lg mb-4 leading-relaxed">
              Premium catering equipment for every business. Quality you can trust. Service you can rely on.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="tel:1800516246"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E31837] hover:bg-[#C41230] text-white font-extrabold text-xs shadow-md transition-all hover:scale-105"
              >
                <Phone className="size-3.5 fill-white text-white" />
                <span>1800 151 624</span>
              </a>
              <button
                type="button"
                onClick={() => setShowQuoteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-extrabold text-xs backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
              >
                <FileText className="size-3.5 text-slate-300" />
                <span>Get Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 1: MAIN FOOTER GRID ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Top row: phone + social */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <Phone className="size-4 text-[#E31837]" />
            <a href={`tel:${(footer.phone || '1800 151 624').replace(/\s/g, '')}`} className="text-white font-extrabold text-base sm:text-lg hover:text-[#E31837] transition-colors tracking-tight">
              Call Us : {footer.phone || '1800 151 624'}
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <a href={footer.socialMedia?.facebook || '#'} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="size-9 rounded-full bg-slate-800/90 hover:bg-[#E31837] text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50">
              <Facebook className="size-4" />
            </a>
            <a href={footer.socialMedia?.instagram || '#'} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="size-9 rounded-full bg-slate-800/90 hover:bg-[#E31837] text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50">
              <Instagram className="size-4" />
            </a>
            <a href={footer.socialMedia?.linkedin || '#'} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
              className="size-9 rounded-full bg-slate-800/90 hover:bg-[#E31837] text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50">
              <Linkedin className="size-4" />
            </a>
            <a href={footer.socialMedia?.youtube || '#'} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
              className="size-9 rounded-full bg-slate-800/90 hover:bg-[#E31837] text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/50">
              <Youtube className="size-4" />
            </a>
          </div>
        </div>

        {/* Main columns: Quick Links | each top-level category as its own column */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-slate-800/60">

          {/* Column: Quick Links */}
          <div className="space-y-3 px-6 first:pl-0">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">QUICK LINKS</h3>
            <div className="w-5 h-0.5 bg-[#E31837]" />
            <ul className="space-y-2.5 text-sm font-medium">
              <li><Link to="/products" className="text-slate-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/delivery-information" className="text-slate-400 hover:text-white transition-colors">Delivery Info</Link></li>
              <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/terms-and-conditions" className="text-slate-400 hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/return-refund-policy" className="text-slate-400 hover:text-white transition-colors">Returns &amp; Refunds</Link></li>
              <li><Link to="/warranty-repairs" className="text-slate-400 hover:text-white transition-colors">Warranty &amp; Repairs</Link></li>
              <li><Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQs</Link></li>
              <li>
                <a href={`mailto:${footer.email || 'info@costplus100.com.au'}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                  <Mail className="size-3 text-[#E31837]" />{footer.email || 'info@costplus100.com.au'}
                </a>
              </li>
              <li>
                <span className="text-slate-500 flex items-start gap-1 text-[11px]">
                  <MapPin className="size-3 text-[#E31837] mt-0.5 shrink-0" />{footer.address || '5/14 Latham Street, Botany NSW 2019'}
                </span>
              </li>
              <li><Link to="/admin/login" className="text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1 text-[11px] pt-1"><Lock className="size-3 text-[#E31837]" />Admin Login</Link></li>
            </ul>
          </div>

          {/* One column per top-level category */}
          {topCategories.length > 0 ? topCategories.slice(0, 4).map((cat: any) => (
            <div key={cat.id} className="space-y-3 px-6">
              <Link
                to={`/products/c/${categoryToSlug(cat.fullPath || cat.slug)}`}
                className="text-xs font-black text-white uppercase tracking-wider hover:text-[#E31837] transition-colors block leading-tight"
              >
                {cat.name}
              </Link>
              <div className="w-5 h-0.5 bg-[#E31837]" />
              <ul className="space-y-2.5 text-sm font-medium">
                {cat.children && cat.children.slice(0, 8).map((child: any) => (
                  <li key={child.id}>
                    <Link
                      to={`/products/c/${categoryToSlug(child.fullPath || child.slug)}`}
                      className="text-slate-400 hover:text-white transition-colors leading-snug block"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
                {cat.children && cat.children.length > 8 && (
                  <li>
                    <Link
                      to={`/products/c/${categoryToSlug(cat.fullPath || cat.slug)}`}
                      className="text-[#E31837] hover:text-red-400 transition-colors text-xs font-bold"
                    >
                      View all →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )) : (
            <div className="space-y-3 px-6">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">CATEGORIES</h3>
              <div className="w-5 h-0.5 bg-[#E31837]" />
              <Link to="/products" className="text-slate-400 hover:text-white transition-colors text-sm">All Products</Link>
            </div>
          )}

        </div>
      </div>

      {/* ── SECTION 3: BOTTOM BAR (Shipping, Payments, Copyright) ── */}
      <div className="w-full border-t border-slate-800/80 bg-[#070D18]/50 pb-20 min-[600px]:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

          {/* Shipping Partners (COPE Sensitive Freight + StarTrack ONLY - Compact) */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center lg:justify-start">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              SHIPPING PARTNERS
            </span>
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-md px-2 py-1 flex items-center justify-center min-w-[110px] h-7 shadow-xs">
                <COPELogo className="h-5.5 w-full" />
              </div>
              <div className="bg-white rounded-md px-2 py-1 flex items-center justify-center min-w-[95px] h-7 shadow-xs">
                <StarTrackLogo className="h-5 w-full" />
              </div>
            </div>
          </div>

          <div className="hidden lg:block h-5 w-px bg-slate-800" />

          {/* Secure Payments (Compact Payment Images) */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center lg:justify-start">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              SECURE PAYMENTS
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <img src="/pyamentimages/visa.png" alt="Visa" className="h-6.5 object-contain rounded px-0.5" />
              <img src="/pyamentimages/mastercard.png" alt="Mastercard" className="h-6.5 object-contain rounded px-0.5" />
              <img src="/pyamentimages/amercianexpress.png" alt="American Express" className="h-6.5 object-contain rounded px-0.5" />
              <div className="bg-slate-800 border border-slate-700 rounded-md px-1.5 py-0.5 flex items-center h-6.5">
                <SquareLogoWhite className="h-5 w-auto" />
              </div>
              <img src="/pyamentimages/gpay.png" alt="Google Pay" className="h-6.5 object-contain rounded px-0.5" />
            </div>
          </div>

          <div className="hidden lg:block h-6 w-px bg-slate-800" />

          {/* Copyright + ABN */}
          <div className="text-center lg:text-right">
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} <span className="text-[#E31837] font-bold">CostPlus100</span>. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">ABN 21 152 496 826</p>
          </div>

        </div>
      </div>
    </div>

      <QuoteModal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </footer>
  );
}