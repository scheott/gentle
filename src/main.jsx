// web/src/main.jsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Check from "./pages/Check.jsx";
import { AuthProvider, useAuth } from "./context/AuthProvider";
import { initPostHog, identifyUser, resetPostHog } from "./lib/posthog";

initPostHog();

function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", fontSize: 18 }}>
      <h1>GentleReader</h1>
      <p>Paste a link to get a calm, plain-English check.</p>
      <p><Link to="/check">Go to Check →</Link></p>
    </main>
  );
}

function PostHogBinder() {
  const { user } = useAuth(); // assumes user is null | { id, email? }
  useEffect(() => {
    if (user?.id) {
      identifyUser({ id: user.id, email: user.email });
    } else {
      resetPostHog();
    }
  }, [user]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <PostHogBinder />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/check" element={<Check />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
