// src/pages/Check.jsx
import { useState } from 'react';
import { posthog } from '../lib/posthog';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CheckPage({ user }) {
  const [url, setUrl] = useState('');
  const [res, setRes] = useState(null);
  const subscribed = !!user?.subscription?.status && user.subscription.status === 'active';

  const freeLimit = 5;
  const used = Number(localStorage.getItem('freeChecksUsed') || 0);
  const blocked = !subscribed && used >= freeLimit;

  async function onSubmit(e) {
    e.preventDefault();
    if (blocked) return;

    posthog.capture('check_submit', { domain: new URL(url).hostname });

    const r = await fetch(`${API}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, user_id: user?.id })
    });

    const data = await r.json();
    if (!r.ok) {
      setRes({ error: data.detail || 'Error' });
      return;
    }
    setRes(data);
    posthog.capture('check_result', { band: data.verdict });

    if (!subscribed) {
      localStorage.setItem('freeChecksUsed', String(used + 1));
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Check a link</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)} />
        <button className="bg-black text-white rounded px-4 py-2" disabled={blocked}>Check</button>
      </form>
      {!subscribed && (
        <p className="mt-2 text-sm text-gray-600">
          Free checks: {Math.min(used, freeLimit)} / {freeLimit}{' '}
          {blocked && <a className="underline" href="/subscribe">Upgrade for unlimited</a>}
        </p>
      )}

      {res && !res.error && (
        <div className="mt-6 border rounded p-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-1 rounded ${
              res.verdict==='ok'?'bg-green-100 text-green-800':
              res.verdict==='warning'?'bg-yellow-100 text-yellow-800':
              'bg-red-100 text-red-800'
            }`}>
              {res.verdict.toUpperCase()}
            </span>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer font-medium">Why?</summary>
            <ul className="list-disc ml-5 mt-2">{res.reasons.map(r => <li key={r}>{r}</li>)}</ul>
          </details>

          <h3 className="mt-4 font-semibold">What it says</h3>
          <pre className="whitespace-pre-wrap text-sm mt-1">{res.summary}</pre>
        </div>
      )}
      {res?.error && <p className="text-red-600 mt-4">{res.error}</p>}
    </div>
  );
}
