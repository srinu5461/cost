// Fully Responsive Trust Bar Component for Mobile, Tablet & Desktop
import { ShieldCheck, Phone, Tag, DollarSign } from 'lucide-react';

function SquareAppIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#000000" />
      <rect x="7" y="7" width="10" height="10" rx="2" fill="#FFFFFF" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#000000" />
    </svg>
  );
}

export function TrustBadges() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 my-4 sm:my-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 md:p-6 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y-0 sm:divide-x divide-slate-200/80 gap-y-3 gap-x-2 sm:gap-0 items-center min-h-[60px] sm:min-h-[72px]">
          
          {/* Row 1, Col 1: Best Price Guaranteed */}
          <div className="flex items-center gap-2 sm:gap-3.5 px-1 sm:px-4 py-1.5 sm:py-1">
            <div className="w-7.5 h-7.5 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E31837] shrink-0 shadow-2xs">
              <ShieldCheck className="size-4 sm:size-5 md:size-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-900 leading-tight">Best Price</h4>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-semibold leading-tight mt-0.5">Guaranteed</p>
            </div>
          </div>

          {/* Row 1, Col 2: 1-800-151-624 */}
          <div className="flex items-center gap-2 sm:gap-3.5 px-1 sm:px-4 py-1.5 sm:py-1">
            <div className="w-7.5 h-7.5 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Phone className="size-4 sm:size-5 md:size-6 stroke-[2.2]" />
            </div>
            <div>
              <a href="tel:1800151624" className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-900 leading-tight hover:text-[#E31837] transition-colors block">
                1-800-151-624
              </a>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-semibold leading-tight mt-0.5 line-clamp-1">Call for prices</p>
            </div>
          </div>

          {/* Row 2: Square (Centered full-width row on mobile) */}
          <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2.5 sm:gap-3 px-1 sm:px-4 py-2 sm:py-1 border-y sm:border-y-0 border-slate-100 my-0.5 sm:my-0">
            <SquareAppIcon className="w-6.5 h-6.5 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0" />
            <span className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight">
              Square
            </span>
          </div>

          {/* Row 3, Col 1: Nisbets Wholesale Range */}
          <div className="flex items-center gap-2 sm:gap-3.5 px-1 sm:px-4 py-1.5 sm:py-1">
            <div className="w-7.5 h-7.5 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
              <Tag className="size-4 sm:size-5 md:size-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-900 leading-tight">Nisbets</h4>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-semibold leading-tight mt-0.5">Wholesale Range</p>
            </div>
          </div>

          {/* Row 3, Col 2: Total Transparency */}
          <div className="flex items-center gap-2 sm:gap-3.5 px-1 sm:px-4 py-1.5 sm:py-1">
            <div className="w-7.5 h-7.5 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <DollarSign className="size-4 sm:size-5 md:size-6 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs md:text-sm font-extrabold text-slate-900 leading-tight">Total</h4>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 font-semibold leading-tight mt-0.5">Transparency</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
