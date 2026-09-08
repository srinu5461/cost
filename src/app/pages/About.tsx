import React from 'react';
import { Link } from 'react-router';
import {
  ShieldCheck, CheckCircle2, Award, Zap, Sparkles, Building2,
  MailCheck, ChevronRight, Check, Target, Building, ArrowRight, Package,
  TrendingUp, Users, Lock, HeartHandshake, Eye, ShoppingCart, Mail,
  Tag, EyeOff, User, VolumeX, Headphones
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { SEOHead } from '../components/SEOHead';

export function About() {
  return (
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white">
      {/* SEO Metadata */}
      <SEOHead
        title="About Costplus100 | Australia's Trusted Catering Equipment Supplier"
        description="Learn about Costplus100 — 30+ years of commercial catering equipment experience supplying Coles, Woolworths, and Coffee Club with our Cost Price + $100 model."
        canonical="https://costplus100.com.au/about"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO / OUR STORY (Full-Width Crisp White bg-white)
         ---------------------------------------------------- */}
      <section className="w-full bg-white py-12 sm:py-16 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Text & 4 Stat Cards */}
            <div className="lg:col-span-6 space-y-5">
              {/* Top Accent Tagline */}
              <div className="flex items-center gap-2 text-xs font-black text-[#E31837] uppercase tracking-widest">
                <span className="w-6 h-0.5 bg-[#E31837]"></span>
                ABOUT COSTPLUS100
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
                About <span className="text-[#E31837]">Costplus100</span>
              </h1>

              {/* Paragraph Copy (Exact User Text) */}
              <div className="space-y-3 text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                <p>
                  We are a group of highly experienced catering industry suppliers with more than 30 years of combined industry knowledge. After supplying some of Australia’s biggest organisations, we came together to create a fresh business model designed to benefit everyday consumers, cafés, caterers, and businesses alike.
                </p>
                <p>
                  Over the years, we have supplied major organisations including Coles Group, Woolworths Group, The Coffee Club, and state councils — just to name a few.
                </p>
                <p className="p-3 bg-red-50 border-l-4 border-l-[#E31837] text-[#0F172A] font-bold rounded-r-xl text-xs sm:text-sm">
                  Our goal is simple: bring honesty, transparency, and fair pricing back into the industry.
                </p>
              </div>

              {/* 4 Stat Box Cards Row (Left Red Border Accent) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { stat: '30+', label: 'Years Experience' },
                  { stat: '10,000+', label: 'Products' },
                  { stat: '$100', label: 'Fixed Markup' },
                  { stat: '100%', label: 'Transparency' },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200/80 border-l-4 border-l-[#E31837] rounded-xl p-3 shadow-2xs hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-black text-[#0F172A] tracking-tight">
                      {card.stat}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Link to="/products">
                  <Button className="bg-[#E31837] hover:bg-red-700 text-white font-extrabold rounded-full px-6 py-2.5 text-xs shadow-sm flex items-center gap-2 cursor-pointer">
                    <span>Browse Equipment Catalog</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Hero Image with Floating Badge Overlay */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-slate-100 bg-slate-100 group">
                <img
                  src="/about_us/hero_kitchen.png"
                  alt="Commercial Kitchen Machinery"
                  className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Certified Service Badge Overlay */}
                <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-white/60 flex items-center gap-3 max-w-[280px]">
                  <div className="size-10 bg-[#0F172A] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0F172A]">30+ Years Experience</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Serving Consumers, Cafés & Caterers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ----------------------------------------------------
          SECTION 2: A DIFFERENT WAY OF DOING BUSINESS (Full-Width Light Gray bg-slate-50)
         ---------------------------------------------------- */}
      <section className="w-full bg-slate-50 py-14 sm:py-18 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Image with Floating Badge */}
            <div className="lg:col-span-6 order-2 lg:order-1 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-100 group">
                <img
                  src="/about_us/warehouse.png"
                  alt="Commercial Catering Warehouse"
                  className="w-full h-[340px] sm:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Formula Badge */}
                <div className="absolute bottom-5 left-5 bg-[#0F172A] text-white p-3.5 rounded-2xl shadow-lg border border-slate-800 flex items-center gap-3 max-w-[280px]">
                  <div className="size-10 bg-[#E31837] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                    <Target className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Cost Price + $100</h4>
                    <p className="text-[10px] text-slate-300 font-medium">Publicly Declared Margin Model</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Text & 4 Feature Cards */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <div className="flex items-center gap-2 text-xs font-black text-[#E31837] uppercase tracking-widest">
                <span className="w-6 h-0.5 bg-[#E31837]"></span>
                A DIFFERENT WAY OF DOING BUSINESS
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
                A Different Way of <span className="text-[#E31837]">Doing Business</span>
              </h2>

              <div className="space-y-3 text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                <p>
                  Think of us as a buying club without the membership fees, hidden catches, or marketing gimmicks.
                </p>
                <p>
                  We operate on a straightforward and publicly declared pricing model: <span className="text-slate-900 font-extrabold">Cost Price + $100 Markup. No more.</span>
                </p>
                <p>
                  That means when you contact us, we will provide you with the true cost price plus our fixed $100 margin — what many would call “mates rates.”
                </p>
              </div>

              {/* 3 Box Chips */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {[
                  'No Inflated Margins.',
                  'No Hidden Fees.',
                  'No Bull.',
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-2xs">
                    <h4 className="text-xs font-black text-[#E31837]">🚫 {item}</h4>
                  </div>
                ))}
              </div>

              {/* Notice Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="size-5 bg-amber-500 text-white rounded-lg flex items-center justify-center shrink-0 font-black text-xs mt-0.5">
                  !
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  <span className="font-extrabold uppercase">Please note:</span> Our published website prices are standard industry prices only. When you contact us directly, we will provide your genuine Cost Plus $100 price.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <Link to="/contact">
                  <Button className="bg-[#0F172A] hover:bg-[#E31837] text-white font-extrabold rounded-full px-6 py-2.5 text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-colors">
                    <span>Contact Us for Mates Rates</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ----------------------------------------------------
          SECTION 3: TOTAL TRANSPARENCY & CORE VALUES (Pure White bg-white, Clean Moderate Typography)
         ---------------------------------------------------- */}
      <section className="w-full bg-white py-14 sm:py-18 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-[#E31837] uppercase tracking-widest">
              <span className="w-8 h-0.5 bg-[#E31837]"></span>
              TOTAL TRANSPARENCY & CORE VALUES
              <span className="w-8 h-0.5 bg-[#E31837]"></span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Our Values. <span className="text-[#E31837]">Your Advantage.</span>
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-lg mx-auto">
              At Costplus100, transparency isn’t just a policy — it’s how we do business. These core values guide every decision we make and every relationship we build.
            </p>

            <div className="flex justify-center pt-0.5">
              <span className="w-10 h-1 bg-[#E31837] rounded-full"></span>
            </div>
          </div>

          {/* 3 Core Value Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Transparency */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
              {/* Top Left Red Ribbon Corner */}
              <div className="absolute top-0 left-0 size-10 bg-[#E31837] rounded-br-2xl"></div>

              <div className="space-y-4 relative z-10 pt-2">
                {/* Circular Icon Badge */}
                <div className="size-14 rounded-full border border-slate-100 bg-white shadow-2xs flex items-center justify-center">
                  <ShieldCheck className="size-7 text-[#E31837]" />
                </div>

                <div>
                  <h3 className="text-base font-black text-[#0F172A] tracking-tight">
                    Total Transparency
                  </h3>
                  <div className="w-6 h-0.5 bg-[#E31837] my-2"></div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                  <p>
                    We believe customers deserve to know exactly what they are paying for.
                  </p>
                  <p>
                    That’s why we openly declare our pricing structure and publicly invite Fair Trading authorities to review any sale, at any time.
                  </p>
                  <p>
                    We are proud to operate with 100% transparency and are committed to helping stop the hidden markups that have become common throughout the industry.
                  </p>
                </div>
              </div>

              {/* Faint Background Watermark Icon */}
              <ShieldCheck className="absolute -bottom-3 -right-3 size-28 text-slate-100/70 pointer-events-none group-hover:scale-110 group-hover:text-red-50 transition-all duration-500" />
            </div>

            {/* Card 2: Real Industry Buying Power */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
              {/* Top Left Dark Navy Ribbon Corner */}
              <div className="absolute top-0 left-0 size-10 bg-[#0F172A] rounded-br-2xl"></div>

              <div className="space-y-4 relative z-10 pt-2">
                {/* Circular Icon Badge */}
                <div className="size-14 rounded-full border border-slate-100 bg-white shadow-2xs flex items-center justify-center">
                  <ShoppingCart className="size-7 text-[#0F172A]" />
                </div>

                <div>
                  <h3 className="text-base font-black text-[#0F172A] tracking-tight">
                    Real Industry Buying Power
                  </h3>
                  <div className="w-6 h-0.5 bg-[#E31837] my-2"></div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                  <p>
                    Because of our long-standing supplier relationships and industry experience, we receive access to importer specials and wholesale opportunities that are normally unavailable to the public.
                  </p>
                  <p>
                    Whenever these special prices are passed on to us, they are also passed directly on to you.
                  </p>
                </div>
              </div>

              {/* Faint Background Watermark Icon */}
              <ShoppingCart className="absolute -bottom-3 -right-3 size-28 text-slate-100/70 pointer-events-none group-hover:scale-110 group-hover:text-slate-200/60 transition-all duration-500" />
            </div>

            {/* Card 3: No Email Harassment */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
              {/* Top Left Red Ribbon Corner */}
              <div className="absolute top-0 left-0 size-10 bg-[#E31837] rounded-br-2xl"></div>

              <div className="space-y-4 relative z-10 pt-2">
                {/* Circular Icon Badge */}
                <div className="size-14 rounded-full border border-slate-100 bg-white shadow-2xs flex items-center justify-center">
                  <Mail className="size-7 text-[#E31837]" />
                </div>

                <div>
                  <h3 className="text-base font-black text-[#0F172A] tracking-tight">
                    No Email Harassment
                  </h3>
                  <div className="w-6 h-0.5 bg-[#E31837] my-2"></div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                  <p>
                    We are not a spam-style marketing organisation.
                  </p>
                  <p>
                    We do not keep your email address for endless promotions or unwanted marketing campaigns. We respect your privacy and believe good service speaks for itself.
                  </p>
                </div>
              </div>

              {/* Faint Background Watermark Icon */}
              <Mail className="absolute -bottom-3 -right-3 size-28 text-slate-100/70 pointer-events-none group-hover:scale-110 group-hover:text-red-50 transition-all duration-500" />
            </div>
          </div>
        </div>
      </section>


      {/* ----------------------------------------------------
          SECTION 4: OUR HERITAGE & ENTERPRISE CLIENTS (Full-Width Light Gray bg-slate-50)
         ---------------------------------------------------- */}
      <section className="w-full bg-slate-50 py-14 sm:py-18 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-[#E31837] uppercase tracking-widest">
                <span className="w-6 h-0.5 bg-[#E31837]"></span>
                OUR HERITAGE
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-1">
                Trusted by Australia’s <span className="text-[#E31837]">Leading Enterprise Brands</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-md">
              Over our 30+ years in commercial catering supply, we have equipped Australia’s largest supermarket chains, hospitality franchises, and public sector institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: 'Coles Group',
                badge: 'Supermarket Supply',
                desc: 'Commercial kitchen equipment lines & supermarket deli outfitting across Australia.',
                icon: Building2,
              },
              {
                name: 'Woolworths Group',
                badge: 'Retail Refrigeration',
                desc: 'Heavy-duty commercial display fridges & stainless steel food prep equipment.',
                icon: Building,
              },
              {
                name: 'The Coffee Club',
                badge: 'Hospitality Chains',
                desc: 'Full kitchen machinery outfits including espresso gear, contact grills & display cabinets.',
                icon: Award,
              },
              {
                name: 'State Councils',
                badge: 'Government Sector',
                desc: 'Compliant commercial catering equipment installations for public facilities and venues.',
                icon: ShieldCheck,
              },
            ].map((client, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-[#E31837] hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="size-9 rounded-xl bg-slate-100 group-hover:bg-[#0F172A] text-[#0F172A] group-hover:text-white flex items-center justify-center transition-colors">
                      <client.icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-black text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      {client.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#0F172A] group-hover:text-[#E31837] transition-colors pt-1">
                    {client.name}
                  </h3>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {client.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-extrabold text-slate-400 group-hover:text-slate-700 flex items-center gap-1">
                  <span>Verified History</span>
                  <ChevronRight className="size-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ----------------------------------------------------
          SECTION 5: HOW WE WORK (Full-Width Crisp White bg-white)
         ---------------------------------------------------- */}
      <section className="w-full bg-white py-14 sm:py-18 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-[#E31837] uppercase tracking-widest">
              <span className="w-6 h-0.5 bg-[#E31837]"></span>
              STRAIGHTFORWARD PROCESS
              <span className="w-6 h-0.5 bg-[#E31837]"></span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">How We Work</h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              We follow a transparent 3-step process to deliver genuine wholesale equipment pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Select Equipment', desc: 'Browse our catalog of commercial fridges, ovens, fryers, & machinery.' },
              { step: '02', title: 'Request Cost + $100 Rate', desc: 'Contact our expert team directly to unlock your cost price plus fixed $100 margin.' },
              { step: '03', title: 'Factory Direct Delivery', desc: 'Direct dispatch from authorized importer warehouses with full manufacturer warranty.' },
            ].map((proc, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden group hover:bg-white hover:border-[#E31837] hover:shadow-lg transition-all duration-300">
                <span className="text-3xl font-black text-slate-400 group-hover:text-[#E31837] transition-colors block mb-2">
                  {proc.step}
                </span>
                <h3 className="text-sm font-black text-[#0F172A] mb-1">{proc.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{proc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ----------------------------------------------------
          SECTION 6: OUR PROMISE (Matching User Reference Screenshot Layout - Moderate Font Size)
         ---------------------------------------------------- */}
      <section className="w-full bg-slate-50 py-14 sm:py-18 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 space-y-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-black text-[#E31837] uppercase tracking-widest">
              <span className="w-8 h-0.5 bg-[#E31837]"></span>
              OUR PROMISE
              <span className="w-8 h-0.5 bg-[#E31837]"></span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Simple, Fair, and Transparent — <span className="text-[#E31837]">The Way Business Should Be.</span>
            </h2>
          </div>

          {/* 6 Grid Cards + 1 Bottom Featured Card */}
          <div className="space-y-4">
            {/* 3-Column x 2-Row Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Genuine wholesale buying power',
                  desc: 'Leverage our strong supplier relationships and real industry experience to bring you the best possible value.',
                  icon: ShoppingCart,
                },
                {
                  title: 'Cost Plus $100 pricing',
                  desc: 'Our simple, fixed markup model. Cost price + $100. No more. No less.',
                  icon: Tag,
                },
                {
                  title: 'No hidden margins',
                  desc: 'What we quote is what you pay. Total honesty, always.',
                  icon: EyeOff,
                },
                {
                  title: 'No membership fees',
                  desc: 'You get the benefit of a buying club without the fees or fine print.',
                  icon: User,
                },
                {
                  title: 'No marketing tricks',
                  desc: "We don't do gimmicks or inflated pricing. Just fair deals, every time.",
                  icon: VolumeX,
                },
                {
                  title: 'Total transparency',
                  desc: 'Open pricing model. Open communication. Open for Fair Trading to review anytime.',
                  icon: ShieldCheck,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#E31837] transition-all duration-300 relative overflow-hidden flex items-start gap-3.5 group"
                >
                  {/* Left Accent Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-[#E31837] transition-colors"></div>

                  {/* Circular Icon Badge */}
                  <div className="size-12 rounded-full bg-slate-100/90 text-[#0F172A] group-hover:bg-red-50 group-hover:text-[#E31837] flex items-center justify-center shrink-0 border border-slate-200/60 transition-colors">
                    <item.icon className="size-6" />
                  </div>

                  <div className="space-y-1 pt-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-[#0F172A] leading-snug">
                      {item.title}
                    </h3>
                    <div className="w-5 h-0.5 bg-[#E31837]/80"></div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom 7th Featured Full-Width Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-[#E31837] transition-all duration-300 relative overflow-hidden flex items-start gap-3.5 group">
              {/* Left Accent Bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31837]"></div>

              {/* Circular Icon Badge */}
              <div className="size-12 rounded-full bg-red-50 text-[#E31837] flex items-center justify-center shrink-0 border border-red-100">
                <Headphones className="size-6" />
              </div>

              <div className="space-y-1 pt-0.5">
                <h3 className="text-sm sm:text-base font-black text-[#0F172A]">
                  Honest service from experienced industry professionals
                </h3>
                <div className="w-6 h-0.5 bg-[#E31837]"></div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Decades of hands-on experience in the catering industry — here to help you succeed.
                </p>
              </div>
            </div>
          </div>

          {/* Closing CTA Banner (Top Navbar Dark Navy bg-[#0F172A]) */}
          <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-5">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Ready for Genuine Wholesale Pricing?
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl mx-auto">
              Contact our team today to get your Cost Plus $100 price on commercial kitchen machinery & equipment.
            </p>
            <div className="flex flex-wrap justify-center gap-3.5 pt-1">
              <Link to="/contact">
                <Button className="bg-[#E31837] hover:bg-red-700 text-white font-extrabold rounded-full px-7 py-3 text-xs shadow-sm flex items-center gap-2 cursor-pointer">
                  <span>Contact Us for Mates Rates</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-bold rounded-full px-7 py-3 text-xs cursor-pointer">
                  View Commercial Equipment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}