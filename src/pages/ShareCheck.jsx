import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ShareCheck() {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-extract URL from query params (iOS/Android share)
  useEffect(() => {
    const sharedUrl = searchParams.get('url') || searchParams.get('u');
    const sharedText = searchParams.get('text') || searchParams.get('title');
    
    let urlToCheck = sharedUrl;
    
    // If no direct URL, try to extract from shared text (Android)
    if (!urlToCheck && sharedText) {
      const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        urlToCheck = urlMatch[0];
      }
    }
    
    if (urlToCheck) {
      setUrl(urlToCheck);
      checkUrl(urlToCheck);
    }
  }, [searchParams]);

  async function checkUrl(urlToCheck) {
    if (!urlToCheck) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCheck })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        setResult({ error: error.detail || 'Could not check this link' });
      }
    } catch (error) {
      setResult({ error: 'Network error - please check your connection' });
    } finally {
      setLoading(false);
    }
  }

  function handleManualCheck() {
    if (url.trim()) {
      setResult(null);
      checkUrl(url.trim());
    }
  }

  const verdictStyles = {
    ok: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200', 
    danger: 'bg-red-50 text-red-800 border-red-200'
  };

  const verdictMessages = {
    ok: { icon: '✅', title: 'Looks reliable', desc: 'This appears to be a trustworthy source' },
    warning: { icon: '⚠️', title: 'Be careful', desc: 'This site has some concerning elements' },
    danger: { icon: '🚨', title: 'High concern', desc: 'This site shows multiple warning signs' }
  };

  const formatReason = (reason) => {
    const reasonMap = {
      'clickbait': 'Uses clickbait headlines',
      'low_domain_rep': 'Domain has poor reputation',
      'sensational_tone': 'Uses sensational language',
      'scam_signals': 'Shows potential scam indicators',
      'health_claims': 'Makes unverified health claims',
      'intrusive_ui': 'Has intrusive pop-ups or ads'
    };
    return reasonMap[reason] || reason.replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first design */}
      <div className="max-w-lg mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GentleReader</h1>
          <p className="text-lg text-gray-600">Let's check this link for you</p>
        </div>

        {/* URL Display */}
        {url && (
          <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">Checking this link:</p>
            <p className="text-sm text-gray-800 break-all leading-relaxed">{url}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"></div>
            <p className="text-lg text-gray-600">Analyzing link...</p>
            <p className="text-sm text-gray-500 mt-1">This usually takes just a few seconds</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {result.error ? (
              <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">❌</span>
                  <h2 className="text-lg font-semibold text-red-800">Couldn't check this link</h2>
                </div>
                <p className="text-red-700">{result.error}</p>
              </div>
            ) : (
              <>
                {/* Main Verdict */}
                <div className={`p-6 rounded-xl border-2 ${verdictStyles[result.verdict]}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{verdictMessages[result.verdict].icon}</span>
                    <div>
                      <h2 className="text-xl font-bold">
                        {verdictMessages[result.verdict].title}
                      </h2>
                      <p className="text-sm opacity-90">
                        {verdictMessages[result.verdict].desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reasons - only show if there are concerns */}
                {result.reasons && result.reasons.length > 0 && (
                  <div className="p-6 bg-white rounded-xl border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>🤔</span>
                      Why we're concerned:
                    </h3>
                    <ul className="space-y-3">
                      {result.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-orange-500 text-sm mt-1">•</span>
                          <span className="text-gray-700 leading-relaxed">
                            {formatReason(reason)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                {result.summary && (
                  <div className="p-6 bg-white rounded-xl border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span>📄</span>
                      What this page says:
                    </h3>
                    <div className="prose prose-sm">
                      <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans">
                        {result.summary}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.history.back()}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-800 rounded-xl font-medium"
                  >
                    ← Go Back
                  </button>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setUrl('');
                    }}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Check Another Link
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Manual URL Entry */}
        {!url && !loading && (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Or paste a link to check:</h3>
            <div className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleManualCheck}
                disabled={!url.trim()}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check This Link
              </button>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 font-medium mb-1">
              💡 How to use GentleReader
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Share any link from Facebook, Safari, or Messages, then tap "GentleReader" 
              to get instant analysis. We help you understand if a website is trustworthy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}