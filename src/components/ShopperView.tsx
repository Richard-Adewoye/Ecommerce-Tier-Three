import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Search, ShoppingBag, User, Clock, ArrowRight, ChevronRight, 
  Star, Check, Truck, MapPin, CreditCard, ArrowLeft, ChevronLeft, 
  Plus, Minus, X, Percent, CheckCircle, Sparkles, Share2, Award, Eye
} from 'lucide-react';
import { Product, CartItem, Address, Order, Customer, INITIAL_ADDRESSES, COUPONS } from '../types';

interface ShopperViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  flashSaleActive: boolean;
  bannerSettings: { title: string; subtitle: string; active: boolean };
  promoPopup: { text: string; active: boolean };
  setPromoPopup: React.Dispatch<React.SetStateAction<{ text: string; active: boolean }>>;
  flashSaleTimer: number; // minutes left
  isOffline: boolean;
}

export default function ShopperView({
  products,
  setProducts,
  orders,
  setOrders,
  customers,
  setCustomers,
  flashSaleActive,
  bannerSettings,
  promoPopup,
  setPromoPopup,
  flashSaleTimer,
  isOffline
}: ShopperViewProps) {
  // Navigation: 'home' | 'shop' | 'account'
  const [activeScreen, setActiveScreen] = useState<'home' | 'shop' | 'account'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Shopping Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  
  // Drawers & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  
  // Checkout flow state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1); // 1: Shipping, 2: Payment/Coupon, 3: Success
  const [selectedAddress, setSelectedAddress] = useState<Address>(INITIAL_ADDRESSES[0]);
  const [addressBook, setAddressBook] = useState<Address[]>(INITIAL_ADDRESSES);
  const [newAddressForm, setNewAddressForm] = useState({ label: '', fullName: '', phone: '', street: '', city: '' });
  const [showAddAddress, setShowAddAddress] = useState(false);
  
  // Checkout calculations & coupons
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Bank Transfer'>('Card');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // New review state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);

  // Countdown timer calculation
  const [timerString, setTimerString] = useState("02:00:00");
  const [secondsLeft, setSecondsLeft] = useState(flashSaleTimer * 60);

  useEffect(() => {
    setSecondsLeft(flashSaleTimer * 60);
  }, [flashSaleTimer, flashSaleActive]);

  useEffect(() => {
    if (!flashSaleActive || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, flashSaleActive]);

  useEffect(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;
    const format = (num: number) => num.toString().padStart(2, '0');
    setTimerString(`${format(hours)}:${format(mins)}:${format(secs)}`);
  }, [secondsLeft]);

  // Load cookies / LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('nouveau-cart');
    const savedWishlist = localStorage.getItem('nouveau-wishlist');
    const savedRecent = localStorage.getItem('nouveau-recent');
    const savedAddresses = localStorage.getItem('nouveau-addresses');

    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedRecent) setRecentlyViewed(JSON.parse(savedRecent));
    if (savedAddresses) {
      const parsedAddrs = JSON.parse(savedAddresses);
      const isStale = parsedAddrs.some((a: any) => a.state === 'Lagos State' || a.fullName === 'Richard Adewoye');
      if (isStale) {
        setAddressBook(INITIAL_ADDRESSES);
        localStorage.setItem('nouveau-addresses', JSON.stringify(INITIAL_ADDRESSES));
      } else {
        setAddressBook(parsedAddrs);
      }
    }

    // Show promotional popup once per session if configured active
    if (promoPopup.active) {
      const shown = sessionStorage.getItem('nouveau-promo-shown');
      if (!shown) {
        setShowPromoModal(true);
        sessionStorage.setItem('nouveau-promo-shown', 'true');
      }
    }
  }, [promoPopup]);

  // Save states helper
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Format Currency
  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Add Product detailed View & save to recently viewed
  const viewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    
    // Add to recently viewed (last 10 items)
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 10);
      saveState('nouveau-recent', updated);
      return updated;
    });
  };

  // Add/Remove wishlist
  const toggleWishlist = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      let updated;
      if (exists) {
        updated = prev.filter(p => p.id !== product.id);
      } else {
        updated = [...prev, product];
      }
      saveState('nouveau-wishlist', updated);
      return updated;
    });
  };

  // Cart operations
  const addToCart = (product: Product, e?: React.MouseEvent, qty: number = 1) => {
    if (e) e.stopPropagation();
    if (product.stock === 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      let updated;
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stock);
        updated = prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      } else {
        updated = [...prev, { product, quantity: Math.min(qty, product.stock) }];
      }
      saveState('nouveau-cart', updated);
      return updated;
    });

    // Bounce cart open slightly as instant feedback
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          return { ...item, quantity: Math.min(nextQty, item.product.stock) };
        }
        return item;
      }).filter(Boolean) as CartItem[];
      saveState('nouveau-cart', updated);
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      saveState('nouveau-cart', updated);
      return updated;
    });
  };

  // Submit product review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim() || !selectedProduct) return;

    const addedReview = {
      id: `rev-${Date.now()}`,
      userName: newReviewAuthor,
      rating: newReviewRating,
      comment: newReviewComment,
      date: new Date().toISOString().split('T')[0],
      isVerified: true
    };

    setProducts(prev => prev.map(p => {
      if (p.id === selectedProduct.id) {
        const reviews = [addedReview, ...p.reviews];
        const rating = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1));
        const updated = {
          ...p,
          reviews,
          reviewsCount: reviews.length,
          rating
        };
        // Update selected detail view state to show review instantly
        setSelectedProduct(updated);
        return updated;
      }
      return p;
    }));

    setReviewSubmitSuccess(true);
    setNewReviewAuthor('');
    setNewReviewComment('');
    setTimeout(() => {
      setReviewSubmitSuccess(false);
    }, 3000);
  };

  // Categories list
  const categories = ['All', 'Produce', 'Meat & Seafood', 'Bakery', 'Dairy', 'Pantry'];

  // Filtering products for shopper
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Recommendation engine (recommend items from the same category that aren't the selected product)
  const getRecommendations = (prod: Product) => {
    return products.filter(p => p.category === prod.category && p.id !== prod.id).slice(0, 4);
  };

  // Checkout flows & pricing
  const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  
  // Coupon deduction
  const getDiscount = () => {
    if (!activeCoupon) return 0;
    const rule = COUPONS[activeCoupon];
    if (!rule) return 0;
    if (rule.type === 'percent') {
      return (subtotal * rule.value) / 100;
    } else {
      return Math.min(rule.value, subtotal);
    }
  };

  const deliveryFee = subtotal > 15000 ? 0 : 2000;
  const grandTotal = subtotal - getDiscount() + deliveryFee;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setActiveCoupon(code);
      setCouponSuccess(`Coupon code '${code}' applied successfully!`);
      setCouponError('');
    } else {
      setCouponError('Invalid promo code. Please try SAVE10, LAGOS50 or FREESHIP');
      setCouponSuccess('');
    }
  };

  // Complete checkout & place order
  const handlePlaceOrder = () => {
    if (cart.length === 0 || isOffline) return;

    const newOrder: Order = {
      id: `NOU-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      subtotal,
      discount: getDiscount(),
      deliveryFee,
      total: grandTotal,
      status: 'Placed',
      address: selectedAddress,
      deliveryZone: selectedAddress.city.includes('Jericho') ? 'Jericho (Ibadan, Oyo State)' : 'Bodija (Ibadan, Oyo State)',
      paymentMethod,
      couponCode: activeCoupon || undefined
    };

    // Update global orders state
    setOrders(prev => [newOrder, ...prev]);

    // Update customer spending history
    setCustomers(prev => prev.map(c => {
      if (c.email === "ayodavid@gmail.com" || c.name === "Ayo David") {
        return {
          ...c,
          totalSpent: c.totalSpent + grandTotal,
          orderCount: c.orderCount + 1
        };
      }
      return c;
    }));

    // Deduct stock levels in global products
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(cItem => cItem.product.id === p.id);
      if (cartItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - cartItem.quantity)
        };
      }
      return p;
    }));

    // Reset checkout states
    setConfirmedOrder(newOrder);
    setCart([]);
    saveState('nouveau-cart', []);
    setActiveCoupon(null);
    setCouponInput('');
    setCheckoutStep(3);
  };

  // Reorder history items
  const handleReorderAll = (order: Order) => {
    setCart([]);
    order.items.forEach(item => {
      addToCart(item.product, undefined, item.quantity);
    });
    setActiveScreen('shop');
    setIsCartOpen(true);
  };

  // Add Address helper
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.fullName || !newAddressForm.phone || !newAddressForm.street || !newAddressForm.city) return;

    const newlyCreated: Address = {
      id: `addr-${Date.now()}`,
      label: newAddressForm.label || "Address",
      fullName: newAddressForm.fullName,
      phone: newAddressForm.phone,
      street: newAddressForm.street,
      city: newAddressForm.city,
      state: "Oyo State",
      isDefault: addressBook.length === 0
    };

    const updated = [...addressBook, newlyCreated];
    setAddressBook(updated);
    saveState('nouveau-addresses', updated);
    setSelectedAddress(newlyCreated);
    setShowAddAddress(false);
    setNewAddressForm({ label: '', fullName: '', phone: '', street: '', city: '' });
  };

  return (
    <div className="bg-stone-50 text-stone-900 min-h-screen relative font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Editorial Announcement Header - inspired by OKA website */}
      <div className="bg-stone-900 text-stone-100 text-[10px] md:text-xs py-2 px-4 flex flex-col md:flex-row md:items-center justify-between border-b border-stone-800 tracking-wider">
        <div className="flex items-center justify-center gap-2 font-mono uppercase text-stone-400">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>Ibadan Express: Organic Cold-chain Grocery Hand delivery within 45 mins</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-stone-300 font-serif">
          <span>Our Services</span>
          <span>Locations</span>
          <span>Corporate Orders</span>
          <span>Interior Grocers Service</span>
        </div>
      </div>

      {/* Main Luxury OKA-inspired Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-5 md:py-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setActiveScreen('home'); setSelectedCategory('All'); }} 
              className="font-serif text-2xl md:text-3xl font-extrabold tracking-widest text-stone-950 focus:outline-none"
            >
              NOUVEAU
            </button>
            <span className="hidden sm:inline bg-amber-500 text-stone-950 text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase font-mono">
              Market
            </span>
          </div>

          {/* Navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-[11px] font-mono tracking-widest uppercase font-semibold text-stone-600">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveScreen('shop');
                }}
                className={`hover:text-amber-600 transition border-b-2 pb-1 ${
                  activeScreen === 'shop' && selectedCategory === cat ? 'border-amber-500 text-stone-950' : 'border-transparent'
                }`}
              >
                {cat === 'All' ? 'SHOP ALL' : cat}
              </button>
            ))}
          </nav>

          {/* Utility Tools */}
          <div className="flex items-center gap-5 sm:gap-6">
            
            {/* Search toggler for shop screen */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search premium grocers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeScreen !== 'shop') setActiveScreen('shop');
                }}
                className="bg-stone-50 border border-stone-200 text-xs pl-8 pr-3.5 py-1.5 rounded-full w-48 lg:w-56 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-stone-400" />
            </div>

            {/* Account Tab button */}
            <button
              onClick={() => setActiveScreen('account')}
              className={`hover:text-amber-600 transition flex items-center gap-1.5 ${activeScreen === 'account' ? 'text-amber-600' : 'text-stone-700'}`}
              title="Shopper Account Portal"
            >
              <User className="w-5 h-5" />
              <span className="text-[11px] font-mono font-semibold hidden sm:inline uppercase tracking-wider">Ayo</span>
            </button>

            {/* Wishlist Heart */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="hover:text-amber-600 transition relative text-stone-700"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Bag */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="hover:text-amber-600 transition relative text-stone-700 flex items-center gap-1"
              title="Shopping Basket"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-stone-950 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40 py-3.5 px-6 flex justify-around items-center shadow-lg">
        <button 
          onClick={() => { setActiveScreen('home'); setSelectedCategory('All'); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-semibold tracking-wider ${activeScreen === 'home' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span>EXPLORE</span>
        </button>
        <button 
          onClick={() => { setActiveScreen('shop'); setSelectedCategory('All'); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-semibold tracking-wider ${activeScreen === 'shop' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <Search className="w-4.5 h-4.5" />
          <span>SHOP ALL</span>
        </button>
        <button 
          onClick={() => setActiveScreen('account')}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-semibold tracking-wider ${activeScreen === 'account' ? 'text-amber-600' : 'text-stone-500'}`}
        >
          <User className="w-4.5 h-4.5" />
          <span>ACCOUNT</span>
        </button>
      </div>

      {/* MAIN SCREEN ROUTING */}

      {/* SCREEN: HOME (OKA-inspired editorial landing with campaigns) */}
      {activeScreen === 'home' && (
        <div className="space-y-16 animate-fadeIn pb-24">
          
          {/* Dynamic Hero banner CMS */}
          {bannerSettings.active && (
            <section className="relative h-[480px] md:h-[600px] bg-stone-950 text-white overflow-hidden flex items-center">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600" 
                  alt="Premium Gourmet supermarket display" 
                  className="w-full h-full object-cover opacity-35"
                />
              </div>
              
              <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 w-full">
                <div className="max-w-2xl space-y-6">
                  <span className="text-[10px] md:text-xs text-amber-400 font-mono tracking-widest uppercase">Premium Curations</span>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold tracking-tight leading-none text-stone-100">
                    {bannerSettings.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-stone-300 font-sans max-w-lg leading-relaxed">
                    {bannerSettings.subtitle}
                  </p>
                  <div className="pt-4 flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setActiveScreen('shop');
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-heading font-bold px-7 py-3 rounded text-sm tracking-wider uppercase transition flex items-center gap-2"
                    >
                      <span>Explore Baskets</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory('Produce');
                        setActiveScreen('shop');
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-heading font-semibold px-6 py-3 rounded text-sm tracking-wider uppercase transition"
                    >
                      Fresh Organic Produce
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Flash Sale Countdown Banner */}
          {flashSaleActive && (
            <section className="max-w-7xl mx-auto px-4 sm:px-8">
              <div className="bg-rose-950 border border-rose-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-rose-900/30 blur-3xl pointer-events-none" />
                
                <div className="space-y-3 relative z-10 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 bg-rose-500 text-stone-950 text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    <span>Limited Time Flash Sale</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold">Gourmet Deals Ticking Away</h2>
                  <p className="text-xs sm:text-sm text-rose-200 font-sans">
                    Up to 45% off on cold-pressed extra-virgin pantry items, organic Oyo valley honey, and fine sourdough baking. Only while supplies last.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                  <div className="text-center bg-stone-950 border border-rose-900 px-5 py-3 rounded-xl min-w-[150px] shadow-lg">
                    <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Ends In</span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-amber-500 tracking-wider mt-0.5 tabular-nums">{timerString}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setActiveScreen('shop');
                    }}
                    className="bg-white text-rose-950 hover:bg-rose-100 font-heading font-bold text-xs sm:text-sm px-6 py-3.5 rounded-lg tracking-wider uppercase transition shadow-md w-full sm:w-auto"
                  >
                    Shop Flash Deals
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Shopper Bestsellers section - inspired by OKA's "Shop Our Bestsellers" layout */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
              <div>
                <span className="text-xs text-amber-600 font-mono tracking-widest uppercase">Handpicked Favorites</span>
                <h2 className="text-3xl font-heading font-bold mt-1 text-stone-950">Shop Our Bestsellers</h2>
                <p className="text-stone-500 text-sm mt-1">Gourmet staples vetted by fine-dining chefs and households across Ibadan, Oyo State.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setActiveScreen('shop');
                }}
                className="text-stone-950 hover:text-amber-600 text-sm font-mono tracking-wider font-semibold uppercase flex items-center gap-1.5 transition"
              >
                <span>View All Products</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of bestsellers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {products.filter(p => p.isBestseller).slice(0, 4).map(p => {
                const inWishlist = wishlist.some(item => item.id === p.id);
                const hasDiscount = p.originalPrice && p.originalPrice > p.price;
                return (
                  <div 
                    key={p.id} 
                    onClick={() => viewProductDetails(p)}
                    className="group bg-white border border-stone-200/80 rounded-xl overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
                  >
                    {/* Image frame */}
                    <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Badge */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className="bg-stone-950 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                          BESTSELLER
                        </span>
                        {hasDiscount && (
                          <span className="bg-rose-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                            -{Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Heart trigger */}
                      <button
                        onClick={(e) => toggleWishlist(p, e)}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-md bg-white hover:bg-stone-50 transition border border-stone-200/60 ${
                          inWishlist ? 'text-rose-500' : 'text-stone-400'
                        }`}
                        title="Add to Wishlist"
                      >
                        <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
                      </button>

                      {/* Stock level warn */}
                      {p.stock === 0 ? (
                        <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-white text-xs font-heading font-bold uppercase tracking-wider bg-rose-600 px-3 py-1.5 rounded shadow">
                            Out of Stock
                          </span>
                        </div>
                      ) : p.stock < 5 ? (
                        <div className="absolute bottom-2 left-2 right-2 bg-rose-600/90 text-white text-[9px] font-mono text-center py-1 rounded font-bold uppercase">
                          Only {p.stock} units left!
                        </div>
                      ) : null}
                    </div>

                    {/* Metadata detail block */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-stone-400 font-mono uppercase block">{p.category}</span>
                        <h3 className="font-heading font-semibold text-stone-900 group-hover:text-amber-600 transition text-sm sm:text-base line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-xs text-stone-500 font-mono">{p.unit}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                        {/* Pricing */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-semibold font-mono text-stone-950">{formatNaira(p.price).split('.')[0]}</span>
                            {hasDiscount && (
                              <span className="text-xs text-stone-400 font-mono line-through">{formatNaira(p.originalPrice!).split('.')[0]}</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Add Button */}
                        <button
                          onClick={(e) => addToCart(p, e)}
                          disabled={p.stock === 0}
                          className={`font-mono text-[10px] font-bold px-3 py-1.5 rounded transition ${
                            p.stock === 0 
                              ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                              : 'bg-stone-950 text-white hover:bg-stone-850'
                          }`}
                        >
                          Quick Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Premium Editorial Grid Collections Section - inspired by OKA's "Shop by Collection" */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
            <div className="text-center">
              <span className="text-xs text-amber-600 font-mono tracking-widest uppercase">Gourmet Cuisines</span>
              <h2 className="text-3xl font-heading font-bold mt-1 text-stone-950">Shop by Curated Collections</h2>
              <p className="text-stone-500 text-sm mt-1">Elegantly sourced pantry packages suited for bespoke culinary lifestyles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div 
                onClick={() => { setSelectedCategory('Produce'); setActiveScreen('shop'); }}
                className="group relative h-[320px] rounded-2xl overflow-hidden cursor-pointer shadow-md"
              >
                <img 
                  src="https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=600" 
                  alt="Organic Veg Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent flex flex-col justify-end p-6" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 block uppercase">Oyo Valley Organic Farms</span>
                  <h3 className="font-heading text-xl font-bold">Organic Produce Basket</h3>
                  <p className="text-stone-300 text-xs font-sans line-clamp-1">Freshly handpicked vine tomatoes, heirloom carrots, and live greens.</p>
                </div>
              </div>

              <div 
                onClick={() => { setSelectedCategory('Meat & Seafood'); setActiveScreen('shop'); }}
                className="group relative h-[320px] rounded-2xl overflow-hidden cursor-pointer shadow-md"
              >
                <img 
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600" 
                  alt="Premium Cuts Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent flex flex-col justify-end p-6" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 block uppercase">Wet-Aged Prime Cuts</span>
                  <h3 className="font-heading text-xl font-bold">Aged Meats & Salmon</h3>
                  <p className="text-stone-300 text-xs font-sans line-clamp-1">Pasture-raised Angus steaks, precautious cold-smoked salmon cut fillets.</p>
                </div>
              </div>

              <div 
                onClick={() => { setSelectedCategory('Pantry'); setActiveScreen('shop'); }}
                className="group relative h-[320px] rounded-2xl overflow-hidden cursor-pointer shadow-md"
              >
                <img 
                  src="https://images.unsplash.com/photo-1511139088438-a598d1eadff0?auto=format&fit=crop&q=80&w=600" 
                  alt="Artisanal Bakery Collection" 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent flex flex-col justify-end p-6" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-amber-400 block uppercase">Slow-Fermented Goods</span>
                  <h3 className="font-heading text-xl font-bold">Gourmet Sourdough Bakery</h3>
                  <p className="text-stone-300 text-xs font-sans line-clamp-1">Wild yeast starters sourdough crusty loaves and sweet plateau honey jars.</p>
                </div>
              </div>

            </div>
          </section>

          {/* Customer Retention Banner: Free Island Shipping */}
          <section className="bg-amber-500/10 border-y border-amber-500/30 py-12 px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <Award className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-2xl font-heading font-bold text-stone-950">Nouveau Gourmet Club Privilege</h3>
              <p className="text-stone-600 text-sm font-sans">
                Enjoy complimentary express shipping across Bodija, Jericho, and Oluyole Estate on all order baskets over ₦15,000.00. High-converting cold chain packaging is standardized.
              </p>
            </div>
          </section>

        </div>
      )}

      {/* SCREEN: SHOP (Dynamic high-density catalogue listing) */}
      {activeScreen === 'shop' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 animate-fadeIn pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6 mb-8">
            <div>
              <span className="text-xs text-stone-500 font-mono uppercase tracking-widest">Gourmet Catalogue</span>
              <h1 className="text-3xl font-heading font-bold mt-1">
                {selectedCategory === 'All' ? 'Complete Collection' : `${selectedCategory}`}
              </h1>
              <p className="text-stone-500 text-sm mt-1">
                Showing {filteredProducts.length} premium ingredients available for dispatch to your address.
              </p>
            </div>

            {/* Category quick selectors for catalog */}
            <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200/60 max-w-max">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-1.5 text-xs rounded font-mono font-semibold uppercase transition-colors ${
                    selectedCategory === c ? 'bg-amber-500 text-stone-950' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Main Grid Catalogue */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map(p => {
              const inWishlist = wishlist.some(item => item.id === p.id);
              const hasDiscount = p.originalPrice && p.originalPrice > p.price;
              return (
                <div 
                  key={p.id} 
                  onClick={() => viewProductDetails(p)}
                  className="group bg-white border border-stone-200/80 rounded-xl overflow-hidden hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {p.isBestseller && (
                        <span className="bg-stone-950 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                          BESTSELLER
                        </span>
                      )}
                      {p.isFlashSale && flashSaleActive && (
                        <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                          FLASH SALE
                        </span>
                      )}
                    </div>

                    {/* Heart wishlist */}
                    <button
                      onClick={(e) => toggleWishlist(p, e)}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-md bg-white hover:bg-stone-50 transition border border-stone-200/60 ${
                        inWishlist ? 'text-rose-500' : 'text-stone-400'
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
                    </button>

                    {/* Low stock indicators */}
                    {p.stock === 0 ? (
                      <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center">
                        <span className="text-white text-xs font-heading font-bold uppercase tracking-wider bg-rose-600 px-3 py-1.5 rounded shadow">
                          Out of Stock
                        </span>
                      </div>
                    ) : p.stock < 5 ? (
                      <div className="absolute bottom-2 left-2 right-2 bg-rose-600/90 text-white text-[9px] font-mono text-center py-1 rounded font-bold uppercase">
                        Only {p.stock} left in store!
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-stone-400 font-mono uppercase block">{p.category}</span>
                      <h3 className="font-heading font-semibold text-stone-900 group-hover:text-amber-600 transition text-sm sm:text-base line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-mono">{p.unit}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-semibold font-mono text-stone-950">{formatNaira(p.price).split('.')[0]}</span>
                          {hasDiscount && (
                            <span className="text-xs text-stone-400 font-mono line-through">{formatNaira(p.originalPrice!).split('.')[0]}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => addToCart(p, e)}
                        disabled={p.stock === 0}
                        className={`font-mono text-[10px] font-bold px-3 py-1.5 rounded transition ${
                          p.stock === 0 
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                            : 'bg-stone-950 text-white hover:bg-stone-850'
                        }`}
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 border border-dashed border-stone-200 rounded-2xl bg-stone-50">
              <span className="text-sm font-sans italic text-stone-500">No premium items matched your query. Try searching for "tomatoes", "salmon" or clear filtering.</span>
            </div>
          )}
        </div>
      )}

      {/* SCREEN: CUSTOMER ACCOUNT, PORTAL & ORDER MILESTONE TRACKING */}
      {activeScreen === 'account' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 animate-fadeIn pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm text-center">
                <div className="w-20 h-20 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-heading text-3xl font-extrabold mx-auto shadow-md">
                  AD
                </div>
                <h2 className="text-xl font-heading font-bold text-stone-900 mt-4">Ayo David</h2>
                <p className="text-xs text-stone-500 font-mono mt-1">ayodavid@gmail.com</p>
                <span className="inline-block mt-3 bg-stone-100 text-stone-800 font-mono text-[10px] px-3 py-1 rounded-full font-bold">
                  Gourmet Club Elite member
                </span>
                <p className="text-xs text-stone-400 font-mono mt-4 border-t border-stone-100 pt-4">Joined: 2026-01-10</p>
              </div>

              {/* Address Book Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h3 className="font-heading font-bold text-sm">Saved Address Book</h3>
                  <button 
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="text-amber-600 hover:text-amber-700 text-xs font-mono font-bold uppercase flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                </div>

                {/* Add address form */}
                {showAddAddress && (
                  <form onSubmit={handleSaveAddress} className="space-y-3 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 uppercase block">Label (e.g. Home, Office)</label>
                      <input 
                        type="text" 
                        required
                        value={newAddressForm.label}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                        placeholder="Home"
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 uppercase block">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={newAddressForm.fullName}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                        placeholder="Ayo David"
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 uppercase block">Contact Phone</label>
                      <input 
                        type="text" 
                        required
                        value={newAddressForm.phone}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                        placeholder="+234 812 345 6789"
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 uppercase block">Street Address</label>
                      <input 
                        type="text" 
                        required
                        value={newAddressForm.street}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, street: e.target.value })}
                        placeholder="Plot 14, Awolowo Avenue"
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 uppercase block">City / Neighborhood</label>
                      <input 
                        type="text" 
                        required
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        placeholder="Bodija, Ibadan"
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddAddress(false)}
                        className="text-stone-500 hover:text-stone-700 px-2 py-1"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="bg-amber-500 text-stone-950 font-heading font-bold px-3.5 py-1 rounded hover:bg-amber-400"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3.5">
                  {addressBook.map(addr => (
                    <div key={addr.id} className="text-xs border border-stone-100 rounded-xl p-3 flex items-start gap-3 bg-stone-50/50">
                      <MapPin className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="bg-amber-150 text-amber-800 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase font-mono border border-amber-300">Default</span>
                          )}
                        </div>
                        <p className="text-stone-700">{addr.fullName} • {addr.phone}</p>
                        <p className="text-stone-500">{addr.street}, {addr.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Order History & Real-Time Tracking Milestone */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-heading font-bold border-b border-stone-100 pb-3 mb-4">
                  Logistics Tracking & Past Orders
                </h3>

                <div className="space-y-6">
                  {orders.map(order => {
                    const steps = ['Placed', 'Processing', 'Out for Delivery', 'Delivered'];
                    const currentStepIndex = steps.indexOf(order.status);
                    
                    return (
                      <div key={order.id} className="border border-stone-200 rounded-2xl p-5 space-y-5 shadow-sm bg-white hover:border-stone-300 transition">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-stone-400 uppercase">Order Shipment No.</span>
                            <h4 className="font-mono text-sm font-bold text-amber-600 mt-0.5">{order.id}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-stone-500 font-mono">{order.date}</span>
                            <span className="text-sm font-semibold font-mono text-stone-900">
                              {formatNaira(order.total)}
                            </span>
                          </div>
                        </div>

                        {/* Items list summary */}
                        <div className="text-xs text-stone-600 space-y-1">
                          <p className="font-bold text-stone-500 uppercase tracking-widest text-[9px] font-mono">Baskets Composition</p>
                          {order.items.map((item, idx) => (
                            <p key={idx}>
                              <span className="font-bold text-stone-900 font-mono">{item.quantity}x</span> {item.product.name} ({item.product.unit})
                            </p>
                          ))}
                        </div>

                        {/* Visual Order Progress Bar Milestones */}
                        <div className="space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400">Live Cold-chain Delivery Milestone</p>
                          
                          <div className="relative">
                            
                            {/* Connector line background */}
                            <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-stone-200 -z-0" />
                            
                            {/* Active connection line */}
                            <div 
                              className="absolute top-3.5 left-4 h-0.5 bg-amber-500 transition-all duration-500 -z-0" 
                              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 90}%` }}
                            />

                            <div className="relative z-10 flex justify-between">
                              {steps.map((st, idx) => {
                                const isPassed = idx <= currentStepIndex;
                                const isActive = idx === currentStepIndex;
                                return (
                                  <div key={st} className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${
                                      isActive ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold shadow' :
                                      isPassed ? 'bg-stone-950 border-stone-900 text-white' :
                                      'bg-white border-stone-200 text-stone-400'
                                    }`}>
                                      {isPassed ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-mono">{idx + 1}</span>}
                                    </div>
                                    <span className={`text-[10px] font-mono font-semibold capitalize ${
                                      isActive ? 'text-amber-600 font-bold' : isPassed ? 'text-stone-800' : 'text-stone-400'
                                    }`}>
                                      {st}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        </div>

                        {/* Logistics details (Driver / Zone / etc) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-stone-50/50 p-3 rounded-lg border border-stone-100">
                          <div>
                            <span className="text-stone-400 font-mono text-[9px] uppercase block">Logistics Driver</span>
                            <span className="font-semibold text-stone-800 flex items-center gap-1.5 mt-0.5">
                              <Truck className="w-3.5 h-3.5 text-amber-500" />
                              {order.driverName || "Assigning premium driver..."}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 font-mono text-[9px] uppercase block">Destination Zone</span>
                            <span className="font-semibold text-stone-800 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              {order.deliveryZone}
                            </span>
                          </div>
                        </div>

                        {/* Reorder Button */}
                        <div className="flex justify-end pt-2 border-t border-stone-100">
                          <button
                            onClick={() => handleReorderAll(order)}
                            className="bg-stone-950 hover:bg-stone-850 text-white font-heading font-bold text-xs px-4 py-2 rounded-lg transition"
                          >
                            Reorder All Items
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-stone-950 text-white py-12 px-6 border-t border-stone-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-extrabold tracking-widest text-white">NOUVEAU</h4>
            <p className="text-xs text-stone-400 font-sans leading-relaxed">
              Nigeria's premiere full-stack organic supermarket platform, delivering high-end gourmet provisions, fresh farm heirloom vegetables, and premium dairy stables across Ibadan and Oyo State.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <h5 className="font-mono text-[10px] tracking-widest uppercase text-stone-500">Shop Categories</h5>
            <div className="flex flex-col gap-2 font-mono text-stone-400">
              <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setSelectedCategory('Produce'); setActiveScreen('shop'); }}>Organic Produce</span>
              <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setSelectedCategory('Meat & Seafood'); setActiveScreen('shop'); }}>Prime Meats & Seafood</span>
              <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setSelectedCategory('Bakery'); setActiveScreen('shop'); }}>Gourmet Sourdough</span>
              <span className="hover:text-amber-500 cursor-pointer" onClick={() => { setSelectedCategory('Dairy'); setActiveScreen('shop'); }}>Artisanal Cheese & Dairy</span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <h5 className="font-mono text-[10px] tracking-widest uppercase text-stone-500">Corporate Club</h5>
            <div className="flex flex-col gap-2 font-sans text-stone-400">
              <span>Bespoke Hotel Supply</span>
              <span>Ibadan Office Pantries</span>
              <span>Gift Hamper Curation</span>
              <span>Privilege Rewards Program</span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <h5 className="font-mono text-[10px] tracking-widest uppercase text-stone-500">Developer Testing Sandbox</h5>
            <div className="bg-stone-900 border border-stone-800 p-3.5 rounded-lg space-y-2">
              <p className="text-[10px] text-stone-400">
                You are currently in the AI-powered testing sandbox. You can browse, checkout, view logistics progression, and switch back and forth from the Admin command panel instantly.
              </p>
              <div className="text-[10px] font-mono text-amber-500 font-bold">
                * Real local storage caching enabled.
              </div>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500 text-center">
          <p>© 2026 Nouveau Supermarket Limited. Sourced with purpose. Nigeria.</p>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Sitemap</span>
          </div>
        </div>
      </footer>

      {/* DRAWERS & DIALOGS */}

      {/* DRAWER: WISHLIST HEART */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]" onClick={() => setIsWishlistOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-slideIn">
            <div className="space-y-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <h3 className="text-xl font-heading font-bold text-stone-950 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  <span>Your Saved Wishlist</span>
                </h3>
                <button onClick={() => setIsWishlistOpen(false)} className="text-stone-400 hover:text-stone-900 p-1.5 rounded-full hover:bg-stone-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {wishlist.length === 0 ? (
                <div className="text-center py-20 text-stone-400 text-xs italic space-y-2">
                  <Heart className="w-8 h-8 text-stone-200 mx-auto" />
                  <p>Your wishlist is currently empty.</p>
                  <button 
                    onClick={() => { setIsWishlistOpen(false); setActiveScreen('shop'); }}
                    className="text-amber-600 hover:text-amber-700 font-bold uppercase font-mono mt-2"
                  >
                    Browse Premium Collection
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlist.map(p => (
                    <div key={p.id} className="flex gap-4 border-b border-stone-100 pb-4">
                      <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] text-stone-400 font-mono uppercase block">{p.category}</span>
                        <h4 className="font-heading font-semibold text-sm line-clamp-1 text-stone-900">{p.name}</h4>
                        <p className="text-xs text-stone-500 font-mono">{formatNaira(p.price)}</p>
                        <div className="flex items-center gap-2.5 pt-1.5">
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.stock === 0}
                            className="bg-stone-950 hover:bg-stone-850 text-white font-heading font-bold text-[10px] px-3 py-1 rounded transition"
                          >
                            Add to Basket
                          </button>
                          <button
                            onClick={() => toggleWishlist(p)}
                            className="text-rose-600 hover:text-rose-700 text-[10px] font-mono font-bold uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: SHOPPING BASKET */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-slideIn">
            
            <div className="space-y-6 overflow-y-auto flex-1 pb-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <h3 className="text-xl font-heading font-bold text-stone-950 flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <span>Shopping Basket</span>
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-900 p-1.5 rounded-full hover:bg-stone-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 text-stone-400 text-xs italic space-y-2">
                  <ShoppingBag className="w-8 h-8 text-stone-200 mx-auto" />
                  <p>Your shopping basket is currently empty.</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); setActiveScreen('shop'); }}
                    className="text-amber-600 hover:text-amber-700 font-bold uppercase font-mono mt-2"
                  >
                    Explore Organic Provisions
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-4 border-b border-stone-100 pb-4">
                      <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] text-stone-400 font-mono uppercase block">{item.product.category}</span>
                        <h4 className="font-heading font-semibold text-sm line-clamp-1 text-stone-900">{item.product.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-500 font-mono font-medium">{formatNaira(item.product.price)}</span>
                          <span className="text-xs font-mono font-bold text-stone-900">Total: {formatNaira(item.product.price * item.quantity).split('.')[0]}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50 text-xs">
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              className="px-2 py-1 hover:bg-stone-100 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 font-mono font-bold text-stone-800">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              className="px-2 py-1 hover:bg-stone-100 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-rose-600 hover:text-rose-700 font-mono text-[10px] font-bold uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart footer calculations */}
            {cart.length > 0 && (
              <div className="border-t border-stone-200 pt-4 space-y-4">
                <div className="space-y-1.5 text-xs text-stone-600 font-mono">
                  <div className="flex justify-between">
                    <span>Basket Subtotal:</span>
                    <span>{formatNaira(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>{deliveryFee === 0 ? "FREE (Club Member)" : formatNaira(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-900 font-bold font-heading pt-1.5 border-t border-stone-100">
                    <span>Grand Total:</span>
                    <span>{formatNaira(grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckingOut(true);
                    setCheckoutStep(1);
                  }}
                  className="w-full bg-stone-950 hover:bg-stone-850 text-white font-heading font-bold text-sm py-3.5 rounded-xl tracking-wider uppercase transition text-center block shadow"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* DETAIL MODAL & REVIEWS SECTION: CHOSEN PRODUCT */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl z-10 grid grid-cols-1 md:grid-cols-2 animate-scaleUp">
            
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 z-20 bg-stone-100 hover:bg-stone-200 text-stone-800 p-1.5 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Frame: product image & horizontal recs */}
            <div className="p-6 md:p-8 space-y-6 border-b md:border-b-0 md:border-r border-stone-100">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Dynamic recommendation - you might also like */}
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-mono uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>You Might Also Like</span>
                </h4>
                
                <div className="grid grid-cols-3 gap-2">
                  {getRecommendations(selectedProduct).map(rec => (
                    <div 
                      key={rec.id}
                      onClick={() => setSelectedProduct(rec)}
                      className="bg-stone-50 border border-stone-200 p-2 rounded-lg cursor-pointer hover:border-amber-500/30 hover:bg-white transition flex flex-col gap-1 text-[10px]"
                    >
                      <img src={rec.image} alt={rec.name} className="aspect-[4/3] object-cover rounded" />
                      <h5 className="font-heading font-semibold text-stone-900 line-clamp-1">{rec.name}</h5>
                      <span className="font-mono text-amber-700 font-semibold">{formatNaira(rec.price).split('.')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Frame: product descriptions, sizes & reviews Form */}
            <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-stone-400 font-mono uppercase">{selectedProduct.category}</span>
                  <h2 className="text-2xl font-heading font-bold text-stone-950 leading-tight">{selectedProduct.name}</h2>
                  <p className="text-xs text-stone-500 font-mono">{selectedProduct.unit}</p>
                </div>

                {/* Rating display */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="w-3.5 h-3.5" fill={star <= Math.round(selectedProduct.rating) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="font-bold text-stone-850 font-mono">{selectedProduct.rating}</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500">{selectedProduct.reviewsCount} verified user ratings</span>
                </div>

                <div className="flex items-center gap-2 border-y border-stone-100 py-3">
                  <span className="text-2xl font-semibold text-stone-950 font-mono">
                    {formatNaira(selectedProduct.price)}
                  </span>
                  {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                    <span className="text-sm text-stone-400 line-through font-mono">
                      {formatNaira(selectedProduct.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  {selectedProduct.description}
                </p>

                {/* Action Cart Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    disabled={selectedProduct.stock === 0}
                    className="flex-1 bg-stone-950 hover:bg-stone-850 text-white font-heading font-bold text-xs py-3 rounded-lg uppercase tracking-wider transition text-center"
                  >
                    {selectedProduct.stock === 0 ? "Out of Stock" : "Add to Shopping Basket"}
                  </button>
                  <button
                    onClick={() => toggleWishlist(selectedProduct)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 p-3 rounded-lg transition"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-4.5 h-4.5" fill={wishlist.some(item => item.id === selectedProduct.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Reviews List & Submission Form */}
              <div className="border-t border-stone-100 pt-6 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-stone-500">Verified Shopper Reviews</h3>
                
                {/* Submit new review */}
                <form onSubmit={handleAddReview} className="space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-100 text-xs">
                  <span className="font-bold font-heading text-stone-900 block text-xs">Share Your Feedback</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-400 uppercase">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        placeholder="John Doe"
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-400 uppercase">Star Rating</label>
                      <select
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                      >
                        {[5, 4, 3, 2, 1].map(r => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase">Detailed Comment</label>
                    <textarea 
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Taste of organic tomatoes was extraordinary, crumb structure perfect..."
                      className="bg-white border border-stone-200 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500 h-12"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="bg-stone-950 text-white font-heading text-[10px] font-bold px-4 py-1.5 rounded hover:bg-stone-850 transition"
                  >
                    Submit Verified Review
                  </button>

                  {reviewSubmitSuccess && (
                    <p className="text-[10px] text-emerald-600 font-mono animate-pulse">✓ Review submitted and calculations rebuilt.</p>
                  )}
                </form>

                {/* Reviews output */}
                <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                  {selectedProduct.reviews.map(rev => (
                    <div key={rev.id} className="text-xs border-b border-stone-100 pb-3 last:border-none last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900">{rev.userName}</span>
                          {rev.isVerified && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-300">Verified Buyer</span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-500 my-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-2.5 h-2.5" fill={star <= rev.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <p className="text-stone-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                  {selectedProduct.reviews.length === 0 && (
                    <p className="text-stone-400 text-xs italic text-center py-6">No verified feedback logged for this item yet. Be the first to share details!</p>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: CHECKOUT FULL DIALOG */}
      {isCheckingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" onClick={() => setIsCheckingOut(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl z-10 p-6 md:p-8 overflow-y-auto max-h-[90vh] animate-scaleUp">
            
            <button 
              onClick={() => setIsCheckingOut(false)} 
              className="absolute top-4 right-4 bg-stone-100 hover:bg-stone-200 text-stone-800 p-1.5 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header progress steps */}
            <div className="border-b border-stone-100 pb-5 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Gourmet Checkout</span>
                <h3 className="text-xl font-heading font-bold text-stone-950">Complete Secure Order</h3>
              </div>

              {/* Progress markers */}
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className={`px-2.5 py-1 rounded-full ${checkoutStep === 1 ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 text-stone-500'}`}>1</span>
                <span className="text-stone-300">➔</span>
                <span className={`px-2.5 py-1 rounded-full ${checkoutStep === 2 ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 text-stone-500'}`}>2</span>
                <span className="text-stone-300">➔</span>
                <span className={`px-2.5 py-1 rounded-full ${checkoutStep === 3 ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}>3</span>
              </div>
            </div>

            {/* STEP 1: Logistics & Delivery Address selection */}
            {checkoutStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-heading font-bold text-sm mb-3 text-stone-900">Select Shipping Destination</h4>
                  
                  <div className="grid grid-cols-1 gap-3.5">
                    {addressBook.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr)}
                        className={`text-xs border rounded-xl p-4 cursor-pointer transition flex items-start gap-3.5 bg-stone-50/40 ${
                          selectedAddress.id === addr.id ? 'border-amber-500 bg-amber-500/5' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="bg-stone-900 text-white text-[8px] font-mono px-1.5 rounded uppercase font-bold">Default</span>
                            )}
                          </div>
                          <p className="text-stone-700 font-semibold">{addr.fullName} • {addr.phone}</p>
                          <p className="text-stone-500">{addr.street}, {addr.city}</p>
                        </div>
                        <div className="self-center">
                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${selectedAddress.id === addr.id ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-300'}`}>
                            {selectedAddress.id === addr.id && <Check className="w-3.5 h-3.5 font-bold" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                  <span className="text-xs text-stone-500 font-sans">Ibadan express deliveries are packaged in insulated cold-boxes.</span>
                  <button
                    onClick={() => setCheckoutStep(2)}
                    className="bg-stone-950 hover:bg-stone-850 text-white font-heading font-bold text-xs px-6 py-3 rounded-lg uppercase tracking-wider transition"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Coupons, promo codes and checkout calculations */}
            {checkoutStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Coupon, Promo & payment methods */}
                <div className="md:col-span-3 space-y-5">
                  
                  {/* Payment selection */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-bold text-sm text-stone-950">Payment Method</h4>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div 
                        onClick={() => setPaymentMethod('Card')}
                        className={`border rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center gap-2 bg-stone-50/40 ${
                          paymentMethod === 'Card' ? 'border-amber-500 bg-amber-500/5' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-sans font-medium text-stone-900">Credit / Debit Card</span>
                      </div>
                      <div 
                        onClick={() => setPaymentMethod('Bank Transfer')}
                        className={`border rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center gap-2 bg-stone-50/40 ${
                          paymentMethod === 'Bank Transfer' ? 'border-amber-500 bg-amber-500/5' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <Truck className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-sans font-medium text-stone-900">Bank Transfer</span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Promo code engine */}
                  <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5 font-heading font-bold text-stone-900 text-sm">
                      <Percent className="w-4.5 h-4.5 text-amber-500" />
                      <span>Apply Promotional Coupon</span>
                    </div>
                    <p className="text-[11px] text-stone-500">Enter active codes like <strong>SAVE10</strong>, <strong>LAGOS50</strong> or <strong>FREESHIP</strong> for dynamic subtotal reductions.</p>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="SAVE10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="bg-white border border-stone-200 px-3 py-2 rounded focus:outline-none focus:border-amber-500 flex-1 font-mono uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-stone-950 text-white font-heading font-bold px-4 py-2 rounded hover:bg-stone-850"
                      >
                        Apply
                      </button>
                    </div>

                    {couponSuccess && <p className="text-[11px] text-emerald-600 font-mono mt-1 animate-pulse">✓ {couponSuccess}</p>}
                    {couponError && <p className="text-[11px] text-rose-600 font-mono mt-1">{couponError}</p>}
                  </div>

                </div>

                {/* Basket recap & totals */}
                <div className="md:col-span-2 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-4">
                  <h4 className="font-heading font-bold text-stone-950 text-xs uppercase tracking-wider pb-1.5 border-b border-stone-200">Basket Summary</h4>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2.5">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between gap-2 text-stone-700">
                        <span className="line-clamp-1 flex-1">
                          <strong className="text-stone-900 font-mono">{item.quantity}x</strong> {item.product.name}
                        </span>
                        <span className="font-mono text-stone-900 shrink-0">{formatNaira(item.product.price * item.quantity).split('.')[0]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-stone-200 pt-3 space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatNaira(subtotal).split('.')[0]}</span>
                    </div>
                    {activeCoupon && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount ({activeCoupon}):</span>
                        <span>-{formatNaira(getDiscount()).split('.')[0]}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery charge:</span>
                      <span>{deliveryFee === 0 ? "FREE" : formatNaira(deliveryFee).split('.')[0]}</span>
                    </div>
                    <div className="flex justify-between text-sm text-stone-900 font-bold font-heading pt-2 border-t border-stone-100">
                      <span>Grand Total:</span>
                      <span className="text-stone-950 font-mono">{formatNaira(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-between items-center pt-4 border-t border-stone-100">
                  <button
                    onClick={() => setCheckoutStep(1)}
                    className="text-stone-500 hover:text-stone-850 text-xs font-heading font-bold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isOffline}
                    className={`font-heading font-bold text-xs px-8 py-3.5 rounded-lg uppercase tracking-wider transition ${
                      isOffline 
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    Place Order Basket
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: Order Confirmation Success */}
            {checkoutStep === 3 && confirmedOrder && (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow border border-emerald-300 animate-scaleUp">
                  <Check className="w-8 h-8 font-extrabold" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-heading text-2xl font-bold text-stone-950">Grand Cuisine Ordered!</h4>
                  <p className="text-xs text-stone-500 font-mono">Your secure transaction order reference is: <strong>{confirmedOrder.id}</strong></p>
                  <p className="text-sm text-stone-600 font-sans max-w-md mx-auto">
                    We have charged <strong>{formatNaira(confirmedOrder.total)}</strong> to your payment card. Cold chain packing is currently underway. A delivery driver has been allocated to {confirmedOrder.address.label}.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-xs text-left max-w-md mx-auto space-y-2 font-mono text-stone-600">
                  <div className="flex justify-between font-bold text-stone-800 border-b border-stone-200 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
                    <span>Dispatch Details</span>
                    <span>Standard</span>
                  </div>
                  <p><strong className="text-stone-800">Destination:</strong> {confirmedOrder.address.street}, {confirmedOrder.address.city}</p>
                  <p><strong className="text-stone-800">Estimated Delivery:</strong> Within 45 minutes</p>
                  <p><strong className="text-stone-800">Assigned Driver:</strong> Emeka Nwosu (Logistics Dept)</p>
                </div>

                <div className="pt-4 flex gap-3.5 justify-center">
                  <button
                    onClick={() => {
                      setIsCheckingOut(false);
                      setActiveScreen('account');
                    }}
                    className="bg-stone-950 hover:bg-stone-850 text-white font-heading font-bold text-xs px-6 py-3.5 rounded-lg uppercase tracking-wider transition"
                  >
                    Track Logistics Milestones
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckingOut(false);
                      setActiveScreen('shop');
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-heading font-bold text-xs px-6 py-3.5 rounded-lg uppercase tracking-wider transition border border-stone-200"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL: CAMPAIGN PROMOTION POPUP */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-[1px]">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md p-6 shadow-2xl relative text-center space-y-4 animate-scaleUp">
            <button 
              onClick={() => setShowPromoModal(false)}
              className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 shadow">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-heading text-lg font-bold text-stone-950 uppercase tracking-wide">Privilege Flash Campaign</h4>
            <p className="text-xs text-stone-600 leading-relaxed font-sans max-w-sm">
              {promoPopup.text}
            </p>
            <div className="bg-stone-50 border border-stone-100 p-2.5 rounded font-mono text-xs font-bold text-amber-600 flex items-center justify-center gap-1">
              <Percent className="w-4 h-4 text-amber-500" />
              <span>Use Code "SAVE10" to claim 10% discount on first Basket!</span>
            </div>
            <button
              onClick={() => setShowPromoModal(false)}
              className="w-full bg-stone-950 hover:bg-stone-850 text-white text-xs font-heading font-bold py-3 rounded-lg uppercase tracking-wider"
            >
              Start Curated Shopping
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
