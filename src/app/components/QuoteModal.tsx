import { useState } from 'react';
import { X, Phone, Plus, Trash2, Send, CheckCircle2, Loader2, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const ENQUIRY_TYPES = [
  'Product Quote',
  'Bulk / Wholesale Order',
  'Product Availability',
  'Lead Time Enquiry',
  'Technical Specification',
  'After-Sales / Warranty',
  'General Enquiry',
];

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  prefillCode?: string;
  prefillProductName?: string;
}

export function QuoteModal({ open, onClose, prefillCode, prefillProductName }: QuoteModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    enquiryType: ENQUIRY_TYPES[0],
    message: '',
  });
  const [productCodes, setProductCodes] = useState<string[]>(prefillCode ? [prefillCode] : ['']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!open) return null;

  const addCodeRow = () => setProductCodes(prev => [...prev, '']);

  const updateCode = (index: number, value: string) => {
    setProductCodes(prev => prev.map((c, i) => (i === index ? value : c)));
  };

  const removeCode = (index: number) => {
    setProductCodes(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const filledCodes = productCodes.filter(c => c.trim());
    const codesBlock = filledCodes.length
      ? `\n\nProduct Codes:\n${filledCodes.map(c => `  • ${c.trim()}`).join('\n')}`
      : '';

    const productNameBlock = prefillProductName
      ? `\n\nProduct: ${prefillProductName}`
      : '';

    const body = {
      name: form.name,
      email: form.email,
      subject: `[Quote Request] ${form.enquiryType}`,
      message: `Phone: ${form.phone || 'Not provided'}${productNameBlock}${codesBlock}\n\nEnquiry Type: ${form.enquiryType}\n\n${form.message}`,
    };

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/contact/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send quote request');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSubmitted(false);
      setError('');
      setIsDropdownOpen(false);
      setForm({ name: '', email: '', phone: '', enquiryType: ENQUIRY_TYPES[0], message: '' });
      setProductCodes(prefillCode ? [prefillCode] : ['']);
      onClose();
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="bg-[#E31837] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-black text-white">Get a Quote</h2>
            <p className="text-red-200 text-[11px] sm:text-xs mt-0.5">We'll reply within 1 business day</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20 cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4.5 sm:size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 text-center gap-3 sm:gap-4">
              <div className="bg-green-100 rounded-full p-3 sm:p-4">
                <CheckCircle2 className="size-8 sm:size-12 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Quote Request Sent!</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-xs">
                We've received your enquiry and will get back to you within 1 business day with your{' '}
                <span className="font-semibold text-[#E31837]">Costplus $100</span> price.
              </p>
              <div className="mt-2 p-3 sm:p-4 bg-slate-50 rounded-xl border text-xs sm:text-sm text-slate-600">
                <p className="font-medium mb-1">Want an immediate answer?</p>
                <a href="tel:1800516246" className="flex items-center justify-center gap-2 text-[#E31837] font-black text-base sm:text-lg">
                  <Phone className="size-4 sm:size-5" />
                  1800 516 246
                </a>
              </div>
              <Button onClick={handleClose} className="mt-2 bg-[#E31837] hover:bg-[#C41230] cursor-pointer text-xs sm:text-sm">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-3 sm:space-y-5">
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label htmlFor="q-name" className="text-xs sm:text-sm font-semibold text-slate-800">Name *</Label>
                  <Input
                    id="q-name"
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="h-9 sm:h-10 text-xs sm:text-sm border-slate-300 focus:border-[#E31837] focus:ring-[#E31837]/20"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="q-email" className="text-xs sm:text-sm font-semibold text-slate-800">Email *</Label>
                  <Input
                    id="q-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="h-9 sm:h-10 text-xs sm:text-sm border-slate-300 focus:border-[#E31837] focus:ring-[#E31837]/20"
                  />
                </div>
              </div>

              {/* Phone + Custom Enquiry Type Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label htmlFor="q-phone" className="text-xs sm:text-sm font-semibold text-slate-800">Phone</Label>
                  <Input
                    id="q-phone"
                    type="tel"
                    placeholder="04xx xxx xxx"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="h-9 sm:h-10 text-xs sm:text-sm border-slate-300 focus:border-[#E31837] focus:ring-[#E31837]/20"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-800">Enquiry Type *</Label>
                  
                  {/* Custom React Styled Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full h-9 sm:h-10 px-3 py-1.5 text-left bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 font-medium flex items-center justify-between shadow-2xs hover:border-slate-400 focus:outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/20 transition-all cursor-pointer"
                    >
                      <span className="truncate">{form.enquiryType}</span>
                      <ChevronDown className={`size-3.5 sm:size-4 text-slate-500 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180 text-[#E31837]' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
                          {ENQUIRY_TYPES.map((t) => {
                            const isSelected = form.enquiryType === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setForm(f => ({ ...f, enquiryType: t }));
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-50 text-[#E31837]'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#0F172A]'
                                }`}
                              >
                                <span>{t}</span>
                                {isSelected && <Check className="size-3.5 text-[#E31837] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Codes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-800">Product Codes</Label>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Codes from product page</span>
                </div>
                <div className="space-y-1.5">
                  {productCodes.map((code, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-semibold">
                          #
                        </span>
                        <Input
                          placeholder={`e.g. CP-1234${i > 0 ? `, CP-567${i}` : ''}`}
                          value={code}
                          onChange={e => updateCode(i, e.target.value)}
                          className="h-9 sm:h-10 pl-6 font-mono text-xs sm:text-sm border-slate-300 focus:border-[#E31837] focus:ring-[#E31837]/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCode(i)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded cursor-pointer"
                        aria-label="Remove code"
                      >
                        <Trash2 className="size-3.5 sm:size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCodeRow}
                  className="flex items-center gap-1 text-xs text-[#E31837] hover:text-[#C41230] font-bold transition-colors mt-0.5 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Add another code
                </button>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <Label htmlFor="q-message" className="text-xs sm:text-sm font-semibold text-slate-800">Message</Label>
                <Textarea
                  id="q-message"
                  placeholder="Specific requirements, quantities, delivery timeframe, or questions..."
                  rows={2}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="resize-none text-xs sm:text-sm border-slate-300 focus:border-[#E31837] focus:ring-[#E31837]/20"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-medium">
                  {error}
                </p>
              )}

              {/* Footer Buttons */}
              <div className="flex flex-row gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#E31837] hover:bg-[#C41230] font-extrabold h-9 sm:h-11 cursor-pointer text-white shadow-md text-xs sm:text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 sm:size-4 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5 sm:size-4 mr-1.5" />
                      Send Quote Request
                    </>
                  )}
                </Button>
                <a
                  href="tel:1800516246"
                  className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-9 sm:h-11 rounded-lg sm:rounded-xl border-2 border-slate-800 text-slate-800 font-extrabold text-xs sm:text-sm hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                >
                  <Phone className="size-3.5 sm:size-4" />
                  <span>Call Now</span>
                </a>
              </div>

              <p className="text-center text-[11px] sm:text-xs text-slate-400 font-medium">
                Or call directly on{' '}
                <a href="tel:1800516246" className="text-[#E31837] font-bold">
                  1800 516 246
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
