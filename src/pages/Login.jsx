import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { signIn } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    await signIn(email);
    setSent(true);
  }
  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Sign in</h1>
      {sent ? <p>Magic link sent. Check your email.</p> : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="bg-black text-white rounded px-4 py-2 w-full">Send magic link</button>
        </form>
      )}
    </div>
  );
}
