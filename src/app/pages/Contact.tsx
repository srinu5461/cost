import React, { useState } from 'react';
import {
  Send, User, Mail, Edit2, MessageSquare, Lock,
  MapPin, Headphones, ArrowRight, Phone, Clock, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { logger } from '../utils/logger';
import { notify } from '../utils/notifications';
import { SEOHead } from '../components/SEOHead';
import { Button } from '../components/ui/button';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      logger.debug('Submitting contact form', { name: formData.name, email: formData.email });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/contact/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send message');
      }

      setSubmitStatus('success');
      notify.success('Message Sent!', 'We\'ll get back to you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      logger.error('Contact form submission failed', error);
      setSubmitStatus('error');
      const errMsg = error instanceof Error ? error.message : 'Failed to send message';
      setErrorMessage(errMsg);
      notify.error('Failed to Send Message', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 w-full max-w-[100vw] font-sans selection:bg-[#E31837] selection:text-white pb-20">
      <SEOHead
        title="Contact Us | Cost Plus 100 Catering Equipment"
        description="Contact Cost Plus 100 for commercial catering equipment quotes. Phone 1300 503 043 or email admin@costplus100.com.au. Fast response. Australia-wide delivery."
        keywords="contact catering equipment supplier, commercial kitchen equipment quote, catering supplies Australia enquiry"
        canonical="https://costplus100.com.au/contact"
      />

      {/* ----------------------------------------------------
          SECTION 1: HERO HEADER (Full-Width Top Navbar Dark Navy bg-[#0F172A])
         ---------------------------------------------------- */}
      <section className="w-full bg-[#0F172A] text-white py-14 sm:py-18 mb-10 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-black text-white uppercase tracking-widest">
            <span className="w-8 h-0.5 bg-white/80"></span>
            GET IN TOUCH
            <span className="w-8 h-0.5 bg-white/80"></span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Contact Costplus100
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
            Have a question about our Cost Price + $100 model or need a custom equipment quote? Our expert Australian team is ready to assist you.
          </p>

          <div className="flex justify-center pt-1">
            <span className="w-12 h-1 bg-[#E31837] rounded-full"></span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 2: MAIN CONTENT (Form + Contact Cards)
         ---------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Form (Styled matching Login & Register Page Card) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 relative z-20">
            {/* Header Section Inside Card */}
            <div className="text-center mb-6 flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight mb-1">
                Send us a Message
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mb-3">
                Fill out the form below for fast priority response
              </p>
              <div className="w-12 h-1 bg-[#E31837] rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-bold text-[#0F172A] block ml-0.5">Your Name *</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/20 transition-all text-xs font-medium text-[#0F172A] placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold text-[#0F172A] block ml-0.5">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/20 transition-all text-xs font-medium text-[#0F172A] placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-xs font-bold text-[#0F172A] block ml-0.5">Subject *</label>
                <div className="relative flex items-center">
                  <Edit2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="e.g. Equipment Quote / Commercial Fridge Inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/20 transition-all text-xs font-medium text-[#0F172A] placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-bold text-[#0F172A] block ml-0.5">Message *</label>
                <div className="relative flex items-start">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    id="message"
                    required
                    rows={4}
                    placeholder="Describe your equipment requirements or questions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/20 transition-all text-xs font-medium text-[#0F172A] placeholder:text-slate-400 h-32 resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span>Thank you for your message! Our team will get back to you shortly.</span>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                  <p>{errorMessage || 'Failed to send message. Please try again.'}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#E31837] hover:bg-red-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-red-200 hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-70 text-xs sm:text-sm uppercase tracking-wider"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-slate-400 pt-1">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Your information is 100% confidential and safe with us.</span>
              </div>
            </form>
          </div>

          {/* Right Column: Information & Support Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">

            {/* Email Contact Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs hover:border-[#E31837] hover:shadow-md transition-all flex items-center justify-between gap-3 overflow-hidden group">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="size-10 sm:size-11 rounded-xl bg-red-50 text-[#E31837] flex items-center justify-center shrink-0 border border-red-100 mt-0.5">
                  <Mail className="size-4.5 sm:size-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-black text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100 uppercase tracking-wide whitespace-nowrap">
                    Official Email
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A]">Direct Inquiries</h3>
                  <a href="mailto:admin@costplus100.com.au" className="text-xs font-bold text-[#E31837] hover:underline block truncate">
                    admin@costplus100.com.au
                  </a>
                  <p className="text-xs text-slate-500 font-medium leading-normal">Fast priority response within 24 hours.</p>
                </div>
              </div>
              <img
                src="/contact_us/mail.png"
                className="hidden sm:block w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 opacity-90 group-hover:scale-105 transition-transform"
                alt="Email Illustration"
              />
            </div>

            {/* Pickup Locations Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs hover:border-[#E31837] hover:shadow-md transition-all flex items-center justify-between gap-3 overflow-hidden group">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="size-10 sm:size-11 rounded-xl bg-slate-100 text-[#0F172A] flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                  <MapPin className="size-4.5 sm:size-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-black text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide whitespace-nowrap">
                    Australia Wide
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A]">Pickup Locations</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    You can pick up ordered stock at <span className="font-extrabold text-[#E31837]">Nisbets</span> warehouse hubs across Australia (Sydney, Melbourne, Brisbane, Perth, Adelaide).
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium pt-0.5">Contact us for your nearest location.</p>
                </div>
              </div>
              <img
                src="/contact_us/map.png"
                className="hidden sm:block w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 opacity-90 group-hover:scale-105 transition-transform"
                alt="Location Map Illustration"
              />
            </div>

            {/* Help Banner Card (Sleek Dark Navy Enterprise Card) */}
            <div className="bg-[#0F172A] text-white rounded-2xl p-6 shadow-lg space-y-4 relative overflow-hidden group border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-widest">
                <Headphones className="size-4 text-[#E31837]" />
                <span>EXPERT ASSISTANCE</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                  Need Help Choosing Kitchen Equipment?
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Our commercial catering equipment specialists with 30+ years industry experience are here to assist you with custom equipment matching.
                </p>
              </div>

              <div className="pt-1">
                <a href="mailto:admin@costplus100.com.au" className="inline-block">
                  <Button className="bg-[#E31837] hover:bg-red-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer">
                    <span>Get Expert Advice</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Trust Badges Summary Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2.5">
              <div className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#E31837]" />
                <span>Why Contact Costplus100?</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#E31837]"></span>
                  <span>Cost Price + $100 Fixed Margin — No Inflated Markups</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#E31837]"></span>
                  <span>Factory Direct Dispatch with Full Manufacturer Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-[#E31837]"></span>
                  <span>Supplying Major Australian Enterprise Chains</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}