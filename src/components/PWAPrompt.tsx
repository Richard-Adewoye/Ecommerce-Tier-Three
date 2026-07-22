import React, { useState, useEffect } from 'react';
import { Smartphone, WifiOff, Download, Check, X } from 'lucide-react';

interface PWAPromptProps {
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
}

export default function PWAPrompt({ isOffline, setIsOffline }: PWAPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if user has already installed or dismissed the prompt
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = () => {
    setIsInstalled(true);
    setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    }, 1500);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  return (
    <>
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-sm flex items-center justify-between font-medium sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>
              <strong>Offline Mode Activated</strong> — Browsing cached products, reviews, and cart content. Ordering is disabled until online.
            </span>
          </div>
          <button
            onClick={() => setIsOffline(false)}
            className="text-xs bg-stone-950 text-white px-3 py-1 font-heading font-semibold rounded hover:bg-stone-800 transition"
          >
            Go Online
          </button>
        </div>
      )}

      {/* PWA Promotion Toast */}
      {showPrompt && !isInstalled && (
        <div className="fixed bottom-24 md:bottom-6 right-4 left-4 md:left-auto md:w-96 bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-2xl z-50 text-white flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2.5 bg-stone-800 rounded-lg">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-heading font-semibold text-sm">Install Nouveau App</h4>
              <p className="text-xs text-stone-400 mt-1">
                Install Nouveau Supermarket on your device for lightning-fast speeds, offline browsing, and instant deals.
              </p>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-stone-400 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 justify-end text-xs">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-stone-400 hover:text-white font-medium"
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-heading font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Install Native
            </button>
          </div>
        </div>
      )}

      {/* Installation Success Toast */}
      {isInstalled && (
        <div className="fixed bottom-6 right-4 bg-emerald-600 text-white rounded-xl p-4 shadow-2xl z-50 flex items-center gap-3">
          <div className="p-1 bg-emerald-500 rounded-full">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm">Successfully Installed!</p>
            <p className="text-xs text-emerald-100">Nouveau is now accessible from your Home Screen.</p>
          </div>
        </div>
      )}
    </>
  );
}
