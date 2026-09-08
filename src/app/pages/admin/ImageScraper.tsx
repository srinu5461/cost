import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RefreshCw, Image as ImageIcon, CheckCircle2, XCircle, Download, Key, Info, Sparkles } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Product {
  code: string;
  name: string;
  price: number;
  brand: string;
  currentImages: string[];
  mainImage?: string;
}

export default function ImageScraper() {
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingUropa, setExportingUropa] = useState(false);
  const [uropaProgress, setUropaProgress] = useState<{
    progress: number;
    processed: number;
    total: number;
    success: number;
    errors: number;
  } | null>(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_URL}/image-scraper/brands`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        setBrands(data.brands || []);
      }
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      notify.error('Failed to load brands');
    }
  };

  const fetchProducts = async () => {
    if (!selectedBrand) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/image-scraper/products?brand=${encodeURIComponent(selectedBrand)}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      notify.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.code)));
    }
  };

  const toggleProduct = (code: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedProducts(newSelected);
  };

  const handleScrape = async () => {
    if (selectedProducts.size === 0) {
      notify.error('Please select at least one product');
      return;
    }

    setScraping(true);
    setResults(null);

    try {
      const response = await fetch(`${API_URL}/image-scraper/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          productCodes: Array.from(selectedProducts)
        })
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        notify.success(`Scraping complete! ${data.results.success} succeeded, ${data.results.failed} failed.`);
        fetchProducts();
      } else {
        notify.error(`Scrape error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error scraping images:', error);
      notify.error(`Failed to scrape images: ${error.message}`);
    } finally {
      setScraping(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/image-scraper/export`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const result = await response.json();
      if (!result.success) {
        notify.error(`Export error: ${result.error}`);
        return;
      }

      const headers = ['Code', 'Name', 'Brand', 'Brand Logo', 'Trade Price', 'Main Image', 'Image Count', 'All Images', 'Description'];
      const csvRows = [
        headers.join(','),
        ...result.data.map((row: any) => [
          row.code,
          `"${row.name}"`,
          row.brand ? `"${row.brand}"` : '',
          row.brandLogo || '',
          row.tradePrice,
          row.mainImage,
          row.imageCount,
          `"${row.images}"`,
          `"${row.description}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      notify.success(`Exported ${result.count} products to CSV!`);
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      notify.error(`Failed to export CSV: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportUropaCSV = async () => {
    if (!confirm('This will fetch current prices from Uropa API for all products. Continue?')) {
      return;
    }

    setExportingUropa(true);
    setUropaProgress({ progress: 0, processed: 0, total: 0, success: 0, errors: 0 });

    try {
      let jobId = '';
      let chunkIndex = 0;
      let isComplete = false;

      while (!isComplete) {
        const response = await fetch(`${API_URL}/image-scraper/export-uropa`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jobId: jobId || undefined,
            chunkIndex
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Export failed');
        }

        if (!jobId) {
          jobId = result.jobId;
        }

        setUropaProgress({
          progress: result.progress,
          processed: result.processed,
          total: result.total,
          success: 0,
          errors: 0
        });

        isComplete = result.isComplete;
        chunkIndex++;
      }

      const finalResponse = await fetch(
        `${API_URL}/image-scraper/export-uropa/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      const finalData = await finalResponse.json();

      if (!finalData.success || !finalData.job) {
        throw new Error('Failed to fetch final data');
      }

      const job = finalData.job;
      const sortedData = job.data.sort((a: any, b: any) => a.code.localeCompare(b.code));

      const headers = ['Code', 'Brand', 'Brand Logo', 'Trade Price', 'In Stock', 'Back Order Available', 'Promised Date', 'Error'];
      const csvRows = [
        headers.join(','),
        ...sortedData.map((row: any) => [
          row.code,
          row.brand ? `"${row.brand}"` : '',
          row.brandLogo || '',
          row.tradePrice || 0,
          row.inStock !== undefined ? row.inStock : '',
          row.backOrderAvailable !== undefined ? row.backOrderAvailable : '',
          row.uropaPromisedDate || '',
          row.error ? `"${row.error}"` : ''
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uropa-prices-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      notify.success(`Uropa Export Complete! Downloaded ${job.total} product records.`);
      setUropaProgress(null);
      setExportingUropa(false);

    } catch (error: any) {
      console.error('Error exporting from Uropa:', error);
      notify.error(`Failed to export from Uropa: ${error.message}`);
      setExportingUropa(false);
      setUropaProgress(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <ImageIcon className="size-6 text-[#E31837]" />
            Product Image Scraper
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Scrape product gallery images from Uropa carousel feeds and export enriched catalog CSVs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={async () => {
              const code = prompt('Enter product code to check pricing fields (e.g., CD085-A):');
              if (!code) return;
              try {
                const response = await fetch(`${API_URL}/image-scraper/check-pricing/${code}`, {
                  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                });
                const result = await response.json();
                if (result.success) {
                  notify.info(`Pricing fields found for ${code}. Check browser console for raw object.`);
                } else {
                  notify.error(`Pricing check error: ${result.error}`);
                }
              } catch (error: any) {
                notify.error(`Pricing check error: ${error.message}`);
              }
            }}
            className="h-9 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-xs border border-purple-200 cursor-pointer transition-all"
          >
            Check Pricing
          </button>

          <button
            onClick={async () => {
              const code = prompt('Enter product code to test images (e.g., CD085-A):');
              if (!code) return;
              try {
                const response = await fetch(`${API_URL}/image-scraper/test/${code}`, {
                  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                });
                const result = await response.json();
                notify.info(`Images Array Length for ${code}: ${result.imagesLength}`);
              } catch (error: any) {
                notify.error(`Test images error: ${error.message}`);
              }
            }}
            className="h-9 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs border border-blue-200 cursor-pointer transition-all"
          >
            Test Images
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            {exporting ? <RefreshCw className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Export Catalog CSV
          </button>

          <button
            onClick={handleExportUropaCSV}
            disabled={exportingUropa}
            className="h-9 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            {exportingUropa ? <RefreshCw className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Export Uropa Prices
          </button>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Backend Storage Authentication:</strong> Image scraper endpoints retrieve Uropa Bearer API keys directly from KV storage.
        </div>
      </div>

      {/* Uropa Export Progress Overlay Card */}
      {uropaProgress && (
        <Card className="border-amber-200 bg-amber-50/70 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-amber-100">
            <CardTitle className="text-base text-amber-900 font-extrabold flex items-center gap-2">
              <RefreshCw className="size-4 animate-spin text-amber-600" />
              Fetching Live Prices from Uropa API
            </CardTitle>
            <CardDescription className="text-xs text-amber-800 font-medium">
              Processing {uropaProgress.processed} of {uropaProgress.total} products
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="w-full bg-amber-200/60 rounded-full h-5 overflow-hidden p-0.5">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-300 flex items-center justify-center text-white text-[10px] font-black"
                style={{ width: `${Math.max(uropaProgress.progress, 5)}%` }}
              >
                {uropaProgress.progress}%
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <span className="text-slate-500 font-medium block text-[10px]">Processed</span>
                <span className="font-bold text-slate-900 text-base">{uropaProgress.processed}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <span className="text-slate-500 font-medium block text-[10px]">Success</span>
                <span className="font-bold text-emerald-700 text-base">{uropaProgress.success}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <span className="text-slate-500 font-medium block text-[10px]">Errors</span>
                <span className="font-bold text-red-600 text-base">{uropaProgress.errors}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <span className="text-slate-500 font-medium block text-[10px]">Total</span>
                <span className="font-bold text-slate-900 text-base">{uropaProgress.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Configuration Card */}
      <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-[#0f172a] font-black flex items-center gap-2">
            <Key className="size-4 text-[#E31837]" />
            Uropa API Token Management
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-medium">
            Manage Uropa API Bearer token stored in backend KV storage
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste new Uropa API Bearer token"
              className="flex-1 h-10 border-slate-200 rounded-xl text-xs"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/image-scraper/check-token`, {
                      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                    });
                    const result = await response.json();
                    notify.info(`KV Token: ${result.hasKvToken ? 'Found' : 'Missing'} | Env Token: ${result.hasEnvToken ? 'Found' : 'Missing'}`);
                  } catch (error: any) {
                    notify.error(`Check token error: ${error.message}`);
                  }
                }}
                className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer transition-all"
              >
                Check Token
              </button>
              <button
                onClick={async () => {
                  if (!token) {
                    notify.error('Please enter a token');
                    return;
                  }
                  try {
                    const response = await fetch(`${API_URL}/image-scraper/save-token`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${publicAnonKey}`
                      },
                      body: JSON.stringify({ token })
                    });
                    const result = await response.json();
                    if (result.success) {
                      notify.success('Token saved to backend KV storage!');
                      setToken('');
                    } else {
                      notify.error(`Save token error: ${result.error}`);
                    }
                  } catch (error: any) {
                    notify.error(`Failed to save token: ${error.message}`);
                  }
                }}
                className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-all"
              >
                Save Token
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Selector Card */}
      <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-[#0f172a] font-black">
            Brand Catalog Selector
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="flex-1 h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E31837]/20"
            >
              <option value="">-- Select Brand --</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <button
              onClick={fetchProducts}
              disabled={!selectedBrand || loading}
              className="h-10 px-5 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin size-4" /> : 'Load Products'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid Table Card */}
      {products.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base text-[#0f172a] font-black">
                  Products ({products.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected for image scraping
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs border border-slate-200 transition-all cursor-pointer"
                >
                  {selectedProducts.size === products.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleScrape}
                  disabled={selectedProducts.size === 0 || scraping}
                  className="h-8 px-4 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {scraping ? (
                    <>
                      <RefreshCw className="animate-spin size-3.5" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Download className="size-3.5" />
                      Scrape Selected Images
                    </>
                  )}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === products.length}
                          onChange={handleSelectAll}
                          className="size-4 text-[#E31837] rounded border-slate-300 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-right">Trade Price</th>
                      <th className="p-3 text-center">Current Images</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {products.map((product) => (
                      <tr
                        key={product.code}
                        className={`hover:bg-slate-50/80 transition-colors ${selectedProducts.has(product.code) ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.code)}
                            onChange={() => toggleProduct(product.code)}
                            className="size-4 text-[#E31837] rounded border-slate-300 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{product.code}</td>
                        <td className="p-3 max-w-xs truncate font-semibold">{product.name}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">${product.price?.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          {product.currentImages.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3" />
                              {product.currentImages.length} images
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <XCircle className="size-3" />
                              No images
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scraping Results Card */}
      {results && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base text-[#0f172a] font-black flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600" />
              Scraping Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <CheckCircle2 className="size-4" />
                  Success: {results.success}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-red-800 font-extrabold text-sm">
                  <XCircle className="size-4" />
                  Failed: {results.failed}
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {results.details?.map((detail: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-xl border text-xs ${
                    detail.success ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono font-bold text-slate-900 text-sm">{detail.code}</div>
                      {detail.success ? (
                        <div className="text-emerald-700 font-semibold mt-0.5">
                          ✅ {detail.imagesFound} images scraped
                        </div>
                      ) : (
                        <div className="text-red-600 font-semibold mt-0.5">
                          ❌ {detail.error}
                        </div>
                      )}
                    </div>
                    {detail.success && detail.images && (
                      <div className="flex gap-1.5 shrink-0">
                        {detail.images.slice(0, 3).map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Product ${detail.code}`}
                            className="size-10 object-cover rounded-lg border border-slate-200"
                          />
                        ))}
                        {detail.images.length > 3 && (
                          <div className="size-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            +{detail.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
