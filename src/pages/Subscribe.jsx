// src/pages/Subscribe.jsx
export default function Subscribe({ user }) {
  async function subscribe() {
    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/create-checkout`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ user_id: user?.id, email: user?.email })
    });
    const { url } = await r.json();
    window.location.href = url;
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">GentleReader Plus</h1>
      <p className="mt-2">Unlimited link checks, caregiver tools coming soon.</p>
      <button className="mt-4 bg-black text-white rounded px-4 py-2" onClick={subscribe}>
        Subscribe
      </button>
    </div>
  );
}
