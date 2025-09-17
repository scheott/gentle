import { useState } from 'react';

export default function Setup() {
  const [activeTab, setActiveTab] = useState('ios');
  
  const currentDomain = window.location.origin;
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Setup GentleReader for Your Parent
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help your parent check suspicious links directly from any app on their phone. 
          Setup takes just 2 minutes and works with Facebook, Safari, Messages, and more.
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setActiveTab('ios')}
            className={`px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'ios' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📱 iPhone/iPad
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'android' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🤖 Android
          </button>
        </div>
      </div>

      {/* iOS Setup */}
      {activeTab === 'ios' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span>📱</span>
              iPhone & iPad Setup (2 steps)
            </h2>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="text-lg font-semibold">Install the Shortcut</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  On your parent's iPhone/iPad, tap this button to install the GentleReader shortcut:
                </p>
                <a 
                  href={`https://www.icloud.com/shortcuts/placeholder-shortcut-id`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <span>⬇️</span>
                  Install iPhone Shortcut
                </a>
                <p className="text-sm text-gray-500 mt-2">
                  Note: This will open the Shortcuts app and ask permission to add GentleReader
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="text-lg font-semibold">How Your Parent Uses It</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">From any app:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>See a suspicious link in Facebook/Safari/Messages</li>
                      <li>Tap the Share button (📤)</li>
                      <li>Scroll down and tap "Check with GentleReader"</li>
                      <li>Get instant safety analysis</li>
                    </ol>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">What they'll see:</p>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-green-600">✅</span>
                        <span>Looks reliable</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-600">⚠️</span>
                        <span>Be careful</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-red-600">🚨</span>
                        <span>High concern</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">🧪 Test It Out</h3>
            <p className="text-gray-700 mb-4">
              After installing, test the shortcut with this safe link:
            </p>
            <div className="bg-white p-3 rounded-lg border text-sm font-mono break-all">
              https://www.cdc.gov/flu/index.htm
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this link and choose "Check with GentleReader" - it should show ✅ Looks reliable
            </p>
          </div>
        </div>
      )}

      {/* Android Setup */}
      {activeTab === 'android' && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <span>🤖</span>
              Android Setup (2 steps)
            </h2>
            
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="text-lg font-semibold">Add GentleReader to Home Screen</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    On your parent's Android phone, open this website in Chrome:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <code className="text-sm">{currentDomain}</code>
                  </div>
                  <p className="text-gray-700">Then follow these steps:</p>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside ml-4">
                    <li>Tap the Chrome menu (⋮ three dots in top right)</li>
                    <li>Tap "Add to Home screen"</li>
                    <li>Tap "Add" to confirm</li>
                    <li>GentleReader icon will appear on home screen</li>
                  </ol>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="text-lg font-semibold">How Your Parent Uses It</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">From any app:</h4>
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                      <li>See a suspicious link anywhere</li>
                      <li>Tap and hold the link, then "Share"</li>
                      <li>Look for "GentleReader" in the share menu</li>
                      <li>Tap it to get instant analysis</li>
                    </ol>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Works in:</p>
                    <div className="text-xs space-y-1 text-gray-700">
                      <div>• Facebook</div>
                      <div>• WhatsApp</div>
                      <div>• Messages</div>
                      <div>• Email apps</div>
                      <div>• Any app with sharing</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">🧪 Test It Out</h3>
            <p className="text-gray-700 mb-4">
              After setup, test by sharing this safe link:
            </p>
            <div className="bg-white p-3 rounded-lg border text-sm font-mono break-all">
              https://www.webmd.com
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Share this link and choose "GentleReader" - it should show ✅ Looks reliable
            </p>
          </div>
        </div>
      )}

      {/* Common Questions */}
      <div className="mt-12 bg-white rounded-xl border p-6">
        <h3 className="text-xl font-semibold mb-4">💬 Common Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Does this cost money?</h4>
            <p className="text-sm text-gray-600">
              Basic checking is free. For unlimited checks and caregiver features, it's $10/month with a 7-day free trial.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Is their browsing private?</h4>
            <p className="text-sm text-gray-600">
              Yes. We only analyze links they choose to check. We never track their general browsing or collect personal data.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">What if they need help?</h4>
            <p className="text-sm text-gray-600">
              Email us at support@gentlereader.com. We specialize in helping seniors and their families with technology.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-8 text-center">
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ✅ Setup Complete!
          </h3>
          <p className="text-blue-800 mb-4">
            Your parent can now check suspicious links from any app on their phone.
          </p>
          <a 
            href="/check"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Try the Web Version
          </a>
        </div>
      </div>
    </div>
  );
}