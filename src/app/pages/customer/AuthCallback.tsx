import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SUPABASE_URL = `https://${projectId}.supabase.co`;

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash (Supabase OAuth puts tokens in hash)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
          // Try query params too (some OAuth flows use ?code=)
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          if (code) {
            setStatus('Exchanging auth code...');
            // Exchange code for session via Supabase
            const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': publicAnonKey },
              body: JSON.stringify({ auth_code: code }),
            });
            const tokenData = await res.json();
            if (tokenData.access_token) {
              await loadUserAndRedirect(tokenData.access_token);
              return;
            }
          }
          setStatus('Login failed — no token found. Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        await loadUserAndRedirect(accessToken);
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('Something went wrong. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    const loadUserAndRedirect = async (accessToken: string) => {
      setStatus('Loading your profile...');
      // Fetch the user profile using the access token
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': publicAnonKey },
      });
      const userData = await userRes.json();

      if (!userData.id) {
        setStatus('Failed to load profile. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Build customer object from Google profile
      const meta = userData.user_metadata || {};
      const customer = {
        id: userData.id,
        email: userData.email,
        firstName: meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || meta.given_name || '',
        lastName: meta.full_name?.split(' ').slice(1).join(' ') || meta.family_name || '',
        first_name: meta.full_name?.split(' ')[0] || meta.given_name || '',
        last_name: meta.full_name?.split(' ').slice(1).join(' ') || meta.family_name || '',
        name: meta.full_name || meta.name || userData.email,
        phone: meta.phone || '',
        avatar: meta.avatar_url || meta.picture || '',
        provider: 'google',
      };

      localStorage.setItem('customer', JSON.stringify(customer));
      window.dispatchEvent(new Event('customerLogin'));

      setStatus('Welcome! Redirecting to your dashboard...');
      navigate('/customer/dashboard');
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#E31837] mx-auto" />
        <p className="text-slate-600 font-medium">{status}</p>
      </div>
    </div>
  );
}
