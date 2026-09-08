import { Outlet, useLocation } from 'react-router';
import { Suspense, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AIChatbot } from '../components/AIChatbot';
import { LoadingScreen } from '../components/LoadingScreen';
import { TrustBadges } from '../components/TrustBadges';
import { SEOHead } from '../components/SEOHead';

export function RootLayout() {
  const location = useLocation();

  const isAuthPage = 
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/customer/login') ||
    location.pathname.startsWith('/customer/register') ||
    location.pathname.startsWith('/customer/forgot-password') ||
    location.pathname.startsWith('/customer/reset-password') ||
    location.pathname.startsWith('/admin/login');

  // Force scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw]">
      <SEOHead />
      {!isAuthPage && <Header />}
      <main className="flex-1 w-full">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <AIChatbot />}
    </div>
  );
}