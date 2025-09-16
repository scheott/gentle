import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Check from "./pages/Check.jsx";

function Home() {
  return (
    <main style={{maxWidth:720, margin:"2rem auto", fontSize:18}}>
      <h1>GentleReader</h1>
      <p>Paste a link to get a calm, plain-English check.</p>
      <p><Link to="/check">Go to Check →</Link></p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/check" element={<Check/>} />
    </Routes>
  </BrowserRouter>
);

// src/main.jsx
import { initPostHog, identifyUser } from './lib/posthog';
import { AuthProvider, useAuth } from './context/AuthProvider';
initPostHog();

function PostHogBinder() {
  const { user } = useAuth();
  useEffect(()=>{ identifyUser(user); }, [user]);
  return null;
}

// In your root render tree:
<AuthProvider>
  <PostHogBinder />
  <App />
</AuthProvider>
