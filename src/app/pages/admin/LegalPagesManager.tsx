// Legal Pages Manager - Admin panel for editing Terms, Return Policy, and Privacy Policy
import { useState, useEffect, useMemo } from 'react';
import { Save, FileText, RefreshCw, Shield, AlertCircle, CheckCircle, Eye, Download, Info, Sparkles, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

type PageType = 'terms-and-conditions' | 'return-refund-policy' | 'privacy-policy' | 'delivery-information';

interface PageContent {
  content: string;
  lastUpdated: string;
}

const DEFAULT_CONTENT = {
  'terms-and-conditions': `
    <h2>1. Introduction</h2>
    <p>Welcome to Costplus100. These terms and conditions outline the rules and regulations for the use of our website and services.</p>
    
    <h2>2. Acceptance of Terms</h2>
    <p>By accessing this website and placing an order, you accept these terms and conditions in full. If you disagree with any part of these terms, you must not use our website.</p>
    
    <h2>3. Products and Services</h2>
    <p>All products and services are subject to availability. We reserve the right to discontinue any product at any time without notice.</p>
    <ul>
      <li>Product descriptions are accurate to the best of our knowledge</li>
      <li>Images are for illustrative purposes only</li>
      <li>Prices are subject to change without notice</li>
      <li>All prices are in Australian Dollars (AUD) and include GST</li>
    </ul>
    
    <h2>4. Orders and Payments</h2>
    <p>By placing an order, you warrant that:</p>
    <ul>
      <li>You are legally capable of entering into binding contracts</li>
      <li>You are at least 18 years old</li>
      <li>The information you provide is accurate and complete</li>
    </ul>
    <p>We accept payment via credit card, debit card, and bank transfer through our secure payment gateway.</p>
    
    <h2>5. Shipping and Delivery</h2>
    <p>Delivery times are estimates only and may vary depending on location and product availability. We ship Australia-wide with standard delivery taking 3-5 business days for most items.</p>
    
    <h2>6. Returns and Refunds</h2>
    <p>Please refer to our Return & Refund Policy for detailed information about returns, exchanges, and refunds.</p>
    
    <h2>7. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, Costplus100 shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
    
    <h2>8. Privacy</h2>
    <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.</p>
    
    <h2>9. Intellectual Property</h2>
    <p>All content on this website, including text, graphics, logos, and images, is the property of Costplus100 and protected by Australian and international copyright laws.</p>
    
    <h2>10. Changes to Terms</h2>
    <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website constitutes acceptance of modified terms.</p>
    
    <h2>11. Contact Information</h2>
    <p>For questions about these terms, please contact us at:</p>
    <ul>
      <li>Email: admin@costplus100.com.au</li>
      <li>Phone: (08) 6165 8444</li>
      <li>Address: Perth, Western Australia</li>
    </ul>
  `,
  'return-refund-policy': `
    <h2>Our Commitment to Customer Satisfaction</h2>
    <p>At Costplus100, we stand behind the quality of our products. If you're not completely satisfied with your purchase, we're here to help with returns and refunds according to the policy outlined below.</p>
    
    <h2>1. 30-Day Return Policy</h2>
    <p>We offer a 30-day return policy on most items from the date of delivery. To be eligible for a return:</p>
    <ul>
      <li>Items must be in original, unused condition</li>
      <li>Original packaging must be intact and undamaged</li>
      <li>All accessories, manuals, and components must be included</li>
      <li>Proof of purchase (receipt or order confirmation) must be provided</li>
    </ul>
    
    <h2>2. Non-Returnable Items</h2>
    <p>Certain items cannot be returned for hygiene or safety reasons:</p>
    <ul>
      <li>Custom or special-order items made to your specifications</li>
      <li>Items marked as "Final Sale" or "Non-Returnable"</li>
      <li>Used or installed equipment</li>
      <li>Items without original packaging</li>
      <li>Perishable goods or consumables that have been opened</li>
    </ul>
    
    <h2>3. How to Initiate a Return</h2>
    <p>To start a return, please follow these steps:</p>
    <ol>
      <li>Contact our customer service team at <strong>admin@costplus100.com.au</strong> or call <strong>(08) 6165 8444</strong></li>
      <li>Provide your order number and reason for return</li>
      <li>Wait for return authorization and instructions</li>
      <li>Pack the item securely in its original packaging</li>
      <li>Ship the item to the address provided by our team</li>
    </ol>
    <p><strong>Important:</strong> Do not ship items back without prior authorization. Unauthorized returns may not be accepted.</p>
    
    <h2>4. Refund Process</h2>
    <p>Once we receive and inspect your return:</p>
    <ul>
      <li>If approved, your refund will be processed within 5-7 business days</li>
      <li>Refunds will be issued to the original payment method</li>
      <li>You will receive an email confirmation when the refund is processed</li>
      <li>Please allow 5-10 business days for the refund to appear in your account</li>
    </ul>
    
    <h2>5. Damaged or Defective Items</h2>
    <p>If you receive a damaged or defective item:</p>
    <ul>
      <li>Contact us within 48 hours of delivery</li>
      <li>Provide photos of the damage or defect</li>
      <li>We will arrange for a replacement or full refund at no cost to you</li>
      <li>Return shipping will be covered by Costplus100</li>
    </ul>
    
    <h2>6. Restocking Fees</h2>
    <p>Most returns are processed without a restocking fee. However, a restocking fee may apply if:</p>
    <ul>
      <li>The item is returned after 30 days</li>
      <li>The packaging is damaged or incomplete</li>
      <li>The item shows signs of use or installation</li>
    </ul>
    
    <h2>7. Exchanges</h2>
    <p>We currently do not offer direct exchanges. If you need a different item, please return your purchase for a refund and place a new order.</p>
    
    <h2>8. Contact Us</h2>
    <p>For return questions or assistance, contact us:</p>
    <ul>
      <li>Email: admin@costplus100.com.au</li>
      <li>Phone: (08) 6165 8444</li>
      <li>Business Hours: Monday-Friday, 9am-5pm AWST</li>
    </ul>
  `,
  'privacy-policy': `
    <h2>1. Introduction</h2>
    <p>Costplus100 ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>
    
    <h2>2. Information We Collect</h2>
    <h3>Personal Information</h3>
    <p>We may collect personal information that you voluntarily provide when you:</p>
    <ul>
      <li>Register for an account</li>
      <li>Place an order</li>
      <li>Subscribe to our newsletter</li>
      <li>Contact customer service</li>
      <li>Participate in surveys or promotions</li>
    </ul>
    <p>This information may include:</p>
    <ul>
      <li>Name and contact details (email, phone, address)</li>
      <li>Billing and shipping information</li>
      <li>Payment card details</li>
      <li>Purchase history and preferences</li>
      <li>Communication preferences</li>
    </ul>
    
    <h3>Automatically Collected Information</h3>
    <p>When you visit our website, we automatically collect certain information:</p>
    <ul>
      <li>IP address and location data</li>
      <li>Browser type and version</li>
      <li>Device information</li>
      <li>Pages visited and time spent</li>
      <li>Referring website</li>
      <li>Cookies and similar technologies</li>
    </ul>
    
    <h2>3. How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
      <li>Process and fulfill your orders</li>
      <li>Communicate with you about your orders and account</li>
      <li>Provide customer support</li>
      <li>Send you marketing communications (with your consent)</li>
      <li>Improve our website and services</li>
      <li>Prevent fraud and enhance security</li>
      <li>Comply with legal obligations</li>
    </ul>
    
    <h2>4. Information Sharing and Disclosure</h2>
    <p>We do not sell your personal information. We may share your information with:</p>
    <ul>
      <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (payment processing, shipping, email delivery)</li>
      <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
      <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
    </ul>
    
    <h2>5. Data Security</h2>
    <p>We implement industry-standard security measures to protect your information, including encryption of sensitive data (SSL/TLS), access controls, and secure storage.</p>
    
    <h2>6. Contact Us</h2>
    <p>For questions about this Privacy Policy or our data practices, contact us:</p>
    <ul>
      <li>Email: admin@costplus100.com.au</li>
      <li>Phone: (08) 6165 8444</li>
      <li>Address: Perth, Western Australia</li>
    </ul>
  `,
  'delivery-information': `
    <h2>Store Pickup Available</h2>
    <div style="background-color: #f0f9ff; padding: 1rem; border-left: 4px solid #E31837; margin-bottom: 1.5rem; border-radius: 0.25rem;">
      <p style="font-size: 1.125rem;">You can pickup your ordered stock at <strong>Nisbets</strong> in any location.</p>
    </div>

    <h2>Please Note</h2>
    <div style="background-color: #eff6ff; padding: 1.5rem; border-left: 4px solid #E31837; margin-bottom: 1.5rem; border-radius: 0.25rem;">
      <p style="font-size: 1.125rem;">
        Items are dispatched by supplier, so delivery times vary. We will update you once your order is placed. 
        For any issues, please message <a href="mailto:info@costplus100.com.au" style="color: #E31837; font-weight: bold;">info@costplus100.com.au</a>
      </p>
    </div>

    <p><strong>✓</strong> Small item satchel rate automatically offered where possible</p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left;">Location</th>
          <th style="border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left;">Delivery Times</th>
          <th style="border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left;">Under $300</th>
          <th style="border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left;">Over $300+ (small items only)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #fef9c3;">
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: 600;">SYDNEY METRO</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem;">1-2 days</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: bold;">$30</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: bold; color: #15803d;">FREE</td>
        </tr>
        <tr style="background-color: #fecaca;">
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: 600;">MELBOURNE METRO</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem;">1-2 days</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: bold;">$30</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: bold; color: #15803d;">FREE</td>
        </tr>
        <tr style="background-color: #ccfbf1;">
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: 600;">BRISBANE METRO</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem;">1-2 days</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: bold;">$30</td>
          <td style="border: 1px solid #cbd5e1; padding: 0.75rem; font-weight: bold; color: #15803d;">FREE</td>
        </tr>
      </tbody>
    </table>
  `,
};

export default function LegalPagesManager() {
  const [activeTab, setActiveTab] = useState<PageType>('terms-and-conditions');
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [preview, setPreview] = useState(false);
  
  const [pages, setPages] = useState<Record<PageType, PageContent>>({
    'terms-and-conditions': { content: '', lastUpdated: '' },
    'return-refund-policy': { content: '', lastUpdated: '' },
    'privacy-policy': { content: '', lastUpdated: '' },
    'delivery-information': { content: '', lastUpdated: '' },
  });

  useEffect(() => {
    loadAllPages();
  }, []);

  const loadAllPages = async () => {
    const pageTypes: PageType[] = ['terms-and-conditions', 'return-refund-policy', 'privacy-policy', 'delivery-information'];
    
    for (const pageType of pageTypes) {
      try {
        const response = await fetch(`${API_URL}/legal/${pageType}`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPages(prev => ({
            ...prev,
            [pageType]: {
              content: data.content || '',
              lastUpdated: data.lastUpdated || new Date().toISOString(),
            },
          }));
        }
      } catch (error) {
        console.error(`Failed to load ${pageType}:`, error);
      }
    }
  };

  const initializeDefaultContent = async () => {
    setInitializing(true);
    try {
      const pageTypes: PageType[] = ['terms-and-conditions', 'return-refund-policy', 'privacy-policy', 'delivery-information'];
      
      for (const pageType of pageTypes) {
        const response = await fetch(`${API_URL}/legal/${pageType}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: DEFAULT_CONTENT[pageType],
            lastUpdated: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to initialize ${pageType}`);
        }
      }

      notify.success('All legal pages initialized with default content!');
      loadAllPages();
    } catch (error) {
      console.error('Initialize error:', error);
      notify.error('Error initializing legal pages');
    } finally {
      setInitializing(false);
    }
  };

  const savePage = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/legal/${activeTab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: pages[activeTab].content,
          lastUpdated: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        notify.success('Page content saved successfully!');
        loadAllPages();
      } else {
        notify.error('Failed to save page content');
      }
    } catch (error) {
      console.error('Save error:', error);
      notify.error('Error saving page content');
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (content: string) => {
    setPages(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        content,
      },
    }));
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link'
  ];

  const pageInfo = {
    'terms-and-conditions': {
      icon: FileText,
      title: 'Terms & Conditions',
      description: 'Legal terms for using your website and services',
      publicUrl: '/terms-and-conditions',
    },
    'return-refund-policy': {
      icon: RefreshCw,
      title: 'Return & Refund Policy',
      description: 'Customer return and refund guidelines',
      publicUrl: '/return-refund-policy',
    },
    'privacy-policy': {
      icon: Shield,
      title: 'Privacy Policy',
      description: 'How you collect, use, and protect customer data',
      publicUrl: '/privacy-policy',
    },
    'delivery-information': {
      icon: FileText,
      title: 'Delivery Information',
      description: 'Details about our delivery process and freight rates',
      publicUrl: '/delivery-information',
    },
  };

  const currentPage = pageInfo[activeTab];
  const Icon = currentPage.icon;

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Shield className="size-6 text-[#E31837]" />
            Legal Pages Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Edit and manage store legal documents, terms, privacy policy, return policy, and delivery information
          </p>
        </div>

        <button
          onClick={initializeDefaultContent}
          disabled={initializing}
          className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Download className={`size-4 text-[#E31837] ${initializing ? 'animate-spin' : ''}`} />
          {initializing ? 'Initializing...' : 'Load Default Content'}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Live Legal Document Sync:</strong> Any updates made here instantly publish to your storefront live policies and terms pages.
        </div>
      </div>

      {/* Empty Warning */}
      {!pages[activeTab].content && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-amber-50 text-amber-900 border border-amber-200 shadow-xs">
          <AlertCircle className="size-5 text-amber-600 shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong className="font-extrabold block">No content found for this document!</strong>
            Click <strong>Load Default Content</strong> above to initialize professional legal policy templates.
          </div>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(pageInfo) as PageType[]).map((pageType) => {
          const PageIcon = pageInfo[pageType].icon;
          const isActive = activeTab === pageType;
          return (
            <button
              key={pageType}
              onClick={() => setActiveTab(pageType)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-[#2D3748] text-white border-[#2D3748] shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <PageIcon className={`size-4 ${isActive ? 'text-[#E31837]' : 'text-slate-400'}`} />
              {pageInfo[pageType].title}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Main Editor Card */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            {/* Editor Sub-Header */}
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-slate-200 p-2 rounded-xl shadow-2xs">
                    <Icon className="size-5 text-[#E31837]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#0f172a]">{currentPage.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                      <span>{currentPage.description}</span>
                      {pages[activeTab].lastUpdated && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-[#0f172a] uppercase">
                          <Clock className="size-3 text-[#E31837]" />
                          {new Date(pages[activeTab].lastUpdated).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreview(!preview)}
                    className={`h-9 px-3.5 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      preview 
                        ? 'bg-[#2D3748] text-white hover:bg-[#1a202c]' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {preview ? (
                      <>
                        <FileText className="size-3.5 text-[#E31837]" />
                        Edit Mode
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5 text-blue-600" />
                        Preview
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.open(currentPage.publicUrl, '_blank')}
                    className="h-9 px-3.5 bg-white border border-slate-200 text-[#E31837] hover:bg-rose-50 rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="size-3.5" />
                    Live Page
                  </button>
                </div>
              </div>
            </CardHeader>

            {/* Editor Canvas / Preview */}
            <CardContent className="p-0 bg-white">
              {preview ? (
                <div className="p-4 bg-slate-100/60 min-h-[480px]">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col max-w-4xl mx-auto ring-1 ring-slate-900/5">
                    {/* Browser Header Bar */}
                    <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/20" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500/20" />
                      </div>
                      <div className="mx-auto bg-white rounded-md px-8 py-0.5 text-[10px] text-slate-400 font-bold border border-slate-200/80 shadow-2xs">
                        costplus100.com.au{currentPage.publicUrl}
                      </div>
                    </div>
                    
                    <div className="p-6 sm:p-10 flex-1 bg-white overflow-y-auto">
                      <div 
                        className="legal-content prose prose-slate max-w-none text-slate-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: pages[activeTab].content }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {activeTab === 'delivery-information' ? (
                    <div className="p-4 space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-semibold text-amber-800 flex items-center gap-2">
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
                        <span>Raw HTML Editor: Required to preserve freight tables and styled delivery callouts.</span>
                      </div>
                      <textarea
                        value={pages[activeTab].content}
                        onChange={(e) => updateContent(e.target.value)}
                        className="w-full min-h-[480px] p-4 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-[#E31837] focus:border-[#E31837] focus:outline-none"
                        placeholder="Enter HTML document content here..."
                      />
                    </div>
                  ) : (
                    <div className="quill-editor-wrapper">
                      <ReactQuill
                        value={pages[activeTab].content}
                        onChange={updateContent}
                        modules={modules}
                        formats={formats}
                        style={{ minHeight: '480px' }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => loadAllPages()}
                      className="h-9 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      Reset Changes
                    </button>
                    <button
                      onClick={savePage}
                      disabled={saving}
                      className="h-9 px-6 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <Save className="size-4" />
                      {saving ? 'Saving...' : 'Save Document Changes'}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Guidelines */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                <FileText className="size-4 text-[#E31837]" />
                Writing Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs font-medium text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Use clear, simple business language</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Break terms into numbered sections</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Highlight GST and shipping rules clearly</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                <Shield className="size-4 text-emerald-600" />
                Legal Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs font-medium text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Comply with Australian Consumer Law</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Include support contact details</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Specify 30-day return eligibility rules</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-none shadow-md rounded-xl overflow-hidden text-white">
            <CardHeader className="pb-3 border-b border-slate-800 bg-slate-900/60">
              <CardTitle className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-4 text-[#E31837]" />
                Storefront Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs text-slate-300 font-medium">
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Keep policies accessible in footer</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Review freight rates annually</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Ensure store pickup terms are clear</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}