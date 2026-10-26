import { useEffect, useState } from 'react';

export function AffiliateReferral({ code, onNavigate }: { code: string; onNavigate: (page: string, params?: any, pushHistory?: boolean) => void }) {
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch(`/api/affiliate/referral/${encodeURIComponent(code)}`, { credentials: 'include' })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'This affiliate link is unavailable.');
        if (active) onNavigate('home', undefined, true);
      })
      .catch(err => active && setError(err.message || 'Unable to open this affiliate link.'));
    return () => { active = false; };
  }, [code, onNavigate]);

  return <section className="max-w-lg mx-auto px-6 py-24 text-center">
    <p className="font-serif text-2xl text-brand-green-900">{error ? 'Affiliate link unavailable' : 'Opening BV Life…'}</p>
    <p className="mt-3 text-sm text-brand-green-700">{error || 'Your referral has been applied.'}</p>
  </section>;
}
