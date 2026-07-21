import React, { useState, useEffect } from 'react';
import { 
  INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS, Product, Order, Customer 
} from './types';
import ShopperView from './components/ShopperView';
import AdminDashboard from './components/AdminDashboard';
import PWAPrompt from './components/PWAPrompt';
import { ShoppingCart, ShieldCheck, Wifi, WifiOff, Smartphone } from 'lucide-react';

export default function App() {
  // Global Shared States with LocalStorage Persistence fallback
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('nouveau-products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('nouveau-orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('nouveau-customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // CMS/Marketing State Management
  const [flashSaleActive, setFlashSaleActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('nouveau-flash-sale-active');
    return saved ? JSON.parse(saved) : true;
  });

  const [bannerSettings, setBannerSettings] = useState(() => {
    const saved = localStorage.getItem('nouveau-banner-settings');
    return saved ? JSON.parse(saved) : {
      title: "Proof in the Organic Pattern",
      subtitle: "Fresh organic tomatoes, wet-aged Angus steak prime cuts, and wild-grown beekeeping honey sourced with meticulous purpose.",
      active: true
    };
  });

  const [promoPopup, setPromoPopup] = useState(() => {
    const saved = localStorage.getItem('nouveau-promo-popup');
    return saved ? JSON.parse(saved) : {
      text: "Nouveau Grocery Club Privilege: Receive complimentary, temperature-insulated cold-box delivery across Victoria Island, Lekki & Ikoyi for all order baskets exceeding ₦15,000.00 today.",
      active: true
    };
  });

  const [flashSaleTimer, setFlashSaleTimer] = useState<number>(() => {
    const saved = localStorage.getItem('nouveau-flash-sale-timer');
    return saved ? Number(saved) : 120; // Default 120 minutes
  });

  // PWA & Connection states
  const [isOffline, setIsOffline] = useState(false);

  // Active Sandbox Interface: 'shopper' | 'admin'
  const [activePortal, setActivePortal] = useState<'shopper' | 'admin'>('shopper');

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('nouveau-products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('nouveau-orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('nouveau-customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('nouveau-flash-sale-active', JSON.stringify(flashSaleActive));
  }, [flashSaleActive]);

  useEffect(() => {
    localStorage.setItem('nouveau-banner-settings', JSON.stringify(bannerSettings));
  }, [bannerSettings]);

  useEffect(() => {
    localStorage.setItem('nouveau-promo-popup', JSON.stringify(promoPopup));
  }, [promoPopup]);

  useEffect(() => {
    localStorage.setItem('nouveau-flash-sale-timer', String(flashSaleTimer));
  }, [flashSaleTimer]);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between">
      
      {/* Sandbox Navigation & Simulated Capabilities bar */}
      <div className="bg-stone-950 border-b border-stone-800 text-xs py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="font-mono text-stone-300 font-bold tracking-wider uppercase">Sandbox Mode Active</span>
          </div>
          <span className="text-stone-700">|</span>
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded px-2 py-0.5 text-stone-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono">PWA Native Prompts Enabled</span>
          </div>
        </div>

        {/* Segmented control for Sandbox Switcher */}
        <div className="flex bg-stone-900 p-1 rounded-lg border border-stone-800 gap-1">
          <button
            onClick={() => setActivePortal('shopper')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activePortal === 'shopper' 
                ? 'bg-amber-500 text-stone-950 shadow' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Customer Storefront</span>
          </button>
          <button
            onClick={() => setActivePortal('admin')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activePortal === 'admin' 
                ? 'bg-amber-500 text-stone-950 shadow' 
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Command Center</span>
          </button>
        </div>

        {/* Offline Toggler */}
        <div className="flex items-center gap-2.5 font-mono text-stone-400 text-[11px]">
          <span>Simulate Offline Page:</span>
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`p-1 rounded-lg border transition ${
              isOffline ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold' : 'bg-stone-900 border-stone-800 hover:text-white'
            }`}
            title="Simulate offline product browsing fallback"
          >
            {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progressive Web App Fallback alerts */}
      <PWAPrompt isOffline={isOffline} setIsOffline={setIsOffline} />

      {/* ACTIVE DISPLAY PORTAL PORT */}
      <main className="flex-1">
        {activePortal === 'shopper' ? (
          <ShopperView
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            customers={customers}
            setCustomers={setCustomers}
            flashSaleActive={flashSaleActive}
            bannerSettings={bannerSettings}
            promoPopup={promoPopup}
            setPromoPopup={setPromoPopup}
            flashSaleTimer={flashSaleTimer}
            isOffline={isOffline}
          />
        ) : (
          <AdminDashboard
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
            customers={customers}
            setCustomers={setCustomers}
            flashSaleActive={flashSaleActive}
            setFlashSaleActive={setFlashSaleActive}
            bannerSettings={bannerSettings}
            setBannerSettings={setBannerSettings}
            promoPopup={promoPopup}
            setPromoPopup={setPromoPopup}
            flashSaleTimer={flashSaleTimer}
            setFlashSaleTimer={setFlashSaleTimer}
          />
        )}
      </main>

    </div>
  );
}
