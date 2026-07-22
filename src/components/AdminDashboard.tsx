import React, { useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, ShoppingBag, Percent, AlertTriangle, 
  ToggleLeft, ToggleRight, Download, Send, Truck, Calendar, Edit2, 
  Check, Play, Save, Plus, Trash, Search, MessageSquare, Megaphone, CheckCircle, X
} from 'lucide-react';
import { Product, Order, Customer, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_ADDRESSES, INITIAL_ORDERS, DELIVERY_ZONES, DRIVERS } from '../types';

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  flashSaleActive: boolean;
  setFlashSaleActive: (active: boolean) => void;
  bannerSettings: { title: string; subtitle: string; active: boolean };
  setBannerSettings: React.Dispatch<React.SetStateAction<{ title: string; subtitle: string; active: boolean }>>;
  promoPopup: { text: string; active: boolean };
  setPromoPopup: React.Dispatch<React.SetStateAction<{ text: string; active: boolean }>>;
  flashSaleTimer: number; // minutes left
  setFlashSaleTimer: React.Dispatch<React.SetStateAction<number>>;
}

export default function AdminDashboard({
  products,
  setProducts,
  orders,
  setOrders,
  customers,
  setCustomers,
  flashSaleActive,
  setFlashSaleActive,
  bannerSettings,
  setBannerSettings,
  promoPopup,
  setPromoPopup,
  flashSaleTimer,
  setFlashSaleTimer
}: AdminDashboardProps) {
  // Tabs: 'analytics' | 'inventory' | 'orders' | 'customers' | 'marketing'
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'orders' | 'customers' | 'marketing'>('analytics');
  const [lineChartPeriod, setLineChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Local edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  
  // Filters & Search
  const [inventorySearch, setInventorySearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Custom contact log trigger
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [contactLogMsg, setContactLogMsg] = useState('');
  const [contactLogSuccess, setContactLogSuccess] = useState(false);

  // Simulated Alert log
  const [stockTriggerLogs, setStockTriggerLogs] = useState<string[]>([]);

  // Format currency
  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Metric calculations based on active live orders
  const grossRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const netProfit = grossRevenue * 0.28; // Simulated margin: 28%
  const totalOrdersCount = orders.length;
  const aov = totalOrdersCount > 0 ? grossRevenue / totalOrdersCount : 0;
  const returningCustomerRate = 66.7; // Fixed baseline metrics plus adjustment

  // Chart data: Daily, Weekly, Monthly Revenue
  const dailyChartData = [
    { name: 'Mon', revenue: 420000, profit: 117600 },
    { name: 'Tue', revenue: 510000, profit: 142800 },
    { name: 'Wed', revenue: 480000, profit: 134400 },
    { name: 'Thu', revenue: 650000, profit: 182000 },
    { name: 'Fri', revenue: 890000, profit: 249200 },
    { name: 'Sat', revenue: 1250000, profit: 350000 },
    { name: 'Sun', revenue: grossRevenue, profit: netProfit }
  ];

  const weeklyChartData = [
    { name: 'Week 1', revenue: 2100000, profit: 588000 },
    { name: 'Week 2', revenue: 2450000, profit: 686000 },
    { name: 'Week 3', revenue: 2900000, profit: 812000 },
    { name: 'Week 4', revenue: 3200000 + grossRevenue, profit: 896000 + netProfit }
  ];

  const monthlyChartData = [
    { name: 'Apr', revenue: 9800000, profit: 2744000 },
    { name: 'May', revenue: 11200000, profit: 3136000 },
    { name: 'Jun', revenue: 13400000, profit: 3752000 },
    { name: 'Jul', revenue: 15600000 + grossRevenue, profit: 4368000 + netProfit }
  ];

  const getLineData = () => {
    switch (lineChartPeriod) {
      case 'weekly': return weeklyChartData;
      case 'monthly': return monthlyChartData;
      default: return dailyChartData;
    }
  };

  // Pie chart data: Category distributions
  const categoryChartData = [
    { name: 'Produce', value: products.filter(p => p.category === 'Produce').reduce((acc, p) => acc + (p.price * (30 - p.stock)), 0) },
    { name: 'Meat & Seafood', value: products.filter(p => p.category === 'Meat & Seafood').reduce((acc, p) => acc + (p.price * (20 - p.stock)), 0) },
    { name: 'Bakery', value: products.filter(p => p.category === 'Bakery').reduce((acc, p) => acc + (p.price * (25 - p.stock)), 0) },
    { name: 'Dairy', value: products.filter(p => p.category === 'Dairy').reduce((acc, p) => acc + (p.price * (15 - p.stock)), 0) },
    { name: 'Pantry', value: products.filter(p => p.category === 'Pantry').reduce((acc, p) => acc + (p.price * (35 - p.stock)), 0) },
  ].filter(c => c.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  // Best Selling Products calculation
  const getBestselling = () => {
    return products
      .slice()
      .sort((a, b) => b.reviewsCount - a.reviewsCount)
      .slice(0, 5);
  };

  // Bulk actions on Inventory
  const handleBulkStock = (inStock: boolean) => {
    setProducts(prev => prev.map(p => ({
      ...p,
      stock: inStock ? (p.stock === 0 ? 15 : p.stock) : 0
    })));
  };

  // Save product inline edit
  const saveProductEdit = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, stock: editStockValue, price: editPriceValue };
        
        // Low Stock alert trigger
        if (editStockValue < 5) {
          const alertMsg = `ALERT: '${p.name}' is low on stock (${editStockValue} left). Triggered SMS notification to procurement team.`;
          setStockTriggerLogs(curr => [alertMsg, ...curr]);
        }
        return updated;
      }
      return p;
    }));
    setEditingProductId(null);
  };

  const startEditing = (p: Product) => {
    setEditingProductId(p.id);
    setEditStockValue(p.stock);
    setEditPriceValue(p.price);
  };

  // Update logistics in order
  const handleLogisticsUpdate = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, ...updates };
      }
      return o;
    }));
  };

  // Send contact log SMS simulation
  const triggerContactLog = (cId: string) => {
    if (!contactLogMsg.trim()) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === cId) {
        const timestamp = new Date().toISOString().split('T')[0];
        return {
          ...c,
          notes: `${c.notes}\n[Logged ${timestamp}] Contacted regarding delivery: "${contactLogMsg}"`
        };
      }
      return c;
    }));
    setContactLogSuccess(true);
    setTimeout(() => {
      setContactLogSuccess(false);
      setContactLogMsg('');
    }, 2000);
  };

  // Export reporting helper
  const exportToCSV = (type: 'sales' | 'inventory' | 'customers') => {
    let headers = '';
    let rows = '';
    
    if (type === 'sales') {
      headers = 'Order ID,Date,Items,Total,Status,Delivery Zone,Driver,Payment\n';
      rows = orders.map(o => {
        const itemNames = o.items.map(i => `${i.product.name} (x${i.quantity})`).join(' | ');
        return `"${o.id}","${o.date}","${itemNames.replace(/"/g, '""')}",${o.total},"${o.status}","${o.deliveryZone}","${o.driverName || 'Unassigned'}","${o.paymentMethod}"`;
      }).join('\n');
    } else if (type === 'inventory') {
      headers = 'Product ID,Name,Category,Price (NGN),Stock,Rating,Bestseller,Flash Sale\n';
      rows = products.map(p => {
        return `"${p.id}","${p.name.replace(/"/g, '""')}","${p.category}",${p.price},${p.stock},${p.rating},${p.isBestseller},${p.isFlashSale}`;
      }).join('\n');
    } else {
      headers = 'Customer ID,Name,Email,Phone,Total Spent (NGN),Orders Count,Date Joined\n';
      rows = customers.map(c => {
        return `"${c.id}","${c.name}","${c.email}","${c.phone}",${c.totalSpent},${c.orderCount},"${c.dateJoined}"`;
      }).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nouveau_Supermarket_${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
    p.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.address.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.deliveryZone.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock < 5).length;

  return (
    <div className="bg-stone-950 text-white min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Admin Title Banner */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-stone-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs text-amber-500 font-mono tracking-widest uppercase">Enterprise Administration</span>
          <h1 className="text-3xl font-heading font-bold mt-1">Nouveau Control Center</h1>
          <p className="text-stone-400 text-sm mt-1">Real-time logistics dispatching, bulk stock inventory, and multi-branch revenue analytics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => exportToCSV('sales')} 
            className="bg-stone-900 border border-stone-800 text-xs px-3.5 py-2 rounded-lg font-mono hover:bg-stone-800 text-stone-300 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export Sales
          </button>
          <button 
            onClick={() => exportToCSV('inventory')} 
            className="bg-stone-900 border border-stone-800 text-xs px-3.5 py-2 rounded-lg font-mono hover:bg-stone-800 text-stone-300 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export Audits
          </button>
          <button 
            onClick={() => exportToCSV('customers')} 
            className="bg-stone-900 border border-stone-800 text-xs px-3.5 py-2 rounded-lg font-mono hover:bg-stone-800 text-stone-300 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export Customers
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation / Side Controls panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col gap-1.5 shadow-xl">
            <h2 className="text-xs font-mono tracking-widest uppercase text-stone-500 mb-2 px-2">Navigation</h2>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${activeTab === 'analytics' ? 'bg-amber-500 text-stone-950 font-semibold' : 'hover:bg-stone-800 text-stone-300'}`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4" />
                <span>Executive Analytics</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${activeTab === 'inventory' ? 'bg-amber-500 text-stone-950 font-semibold' : 'hover:bg-stone-800 text-stone-300'}`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Stock & Inventory</span>
              </div>
              {lowStockCount > 0 && (
                <span className="bg-rose-500 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {lowStockCount} ALERT
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${activeTab === 'orders' ? 'bg-amber-500 text-stone-950 font-semibold' : 'hover:bg-stone-800 text-stone-300'}`}
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4" />
                <span>Logistics & Orders</span>
              </div>
              {orders.filter(o => o.status === 'Placed' || o.status === 'Processing').length > 0 && (
                <span className="bg-emerald-500 text-stone-950 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {orders.filter(o => o.status === 'Placed' || o.status === 'Processing').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${activeTab === 'customers' ? 'bg-amber-500 text-stone-950 font-semibold' : 'hover:bg-stone-800 text-stone-300'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Customer Directory</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('marketing')}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${activeTab === 'marketing' ? 'bg-amber-500 text-stone-950 font-semibold' : 'hover:bg-stone-800 text-stone-300'}`}
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4" />
                <span>Marketing & Banners</span>
              </div>
            </button>
          </div>

          {/* Quick Real-Time Notifications Center */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-xl">
            <h3 className="text-xs font-mono tracking-widest uppercase text-stone-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Real-Time Alert Logger</span>
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {lowStockCount > 0 && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-200 text-xs p-2.5 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <div>
                    <span className="font-semibold block">Critical Low Stock Warning</span>
                    {lowStockCount} item(s) are currently below 5 units. Auto-reorder triggers active.
                  </div>
                </div>
              )}
              {stockTriggerLogs.length === 0 && lowStockCount === 0 ? (
                <p className="text-xs text-stone-500 italic">No events or triggers logged in the current session. System status healthy.</p>
              ) : (
                stockTriggerLogs.map((log, index) => (
                  <div key={index} className="bg-amber-950/30 border border-amber-900/50 text-amber-200 text-xs p-2.5 rounded-lg font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="lg:col-span-3 space-y-8">

          {/* Tab Content: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Executive metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-stone-500 font-mono block">Gross Revenue</span>
                    <h3 className="text-2xl font-heading font-bold mt-2 text-stone-100 tabular-nums">{formatNaira(grossRevenue)}</h3>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12.4% vs last week</span>
                  </div>
                </div>

                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-stone-500 font-mono block">Simulated Net Profit (28%)</span>
                    <h3 className="text-2xl font-heading font-bold mt-2 text-emerald-400 tabular-nums">{formatNaira(netProfit)}</h3>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+14.1% margin tier</span>
                  </div>
                </div>

                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-stone-500 font-mono block">Average Order Value</span>
                    <h3 className="text-2xl font-heading font-bold mt-2 text-stone-100 tabular-nums">{formatNaira(aov)}</h3>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-500 font-mono">
                    <span>₦22,500 target baseline</span>
                  </div>
                </div>

                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-stone-500 font-mono block">Returning Shopper Rate</span>
                    <h3 className="text-2xl font-heading font-bold mt-2 text-stone-100 tabular-nums">{returningCustomerRate}%</h3>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                    <span>Optimal loyalty status</span>
                  </div>
                </div>

              </div>

              {/* Graphical Analysis section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Revenue Timeline */}
                <div className="md:col-span-2 bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-heading font-bold">Revenue & Margin Growth</h3>
                      <p className="text-xs text-stone-500">Live transaction progression mapped to periods.</p>
                    </div>
                    <div className="bg-stone-950 p-1 rounded-lg border border-stone-800 flex gap-1">
                      {(['daily', 'weekly', 'monthly'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setLineChartPeriod(p)}
                          className={`px-3 py-1 text-xs rounded capitalize font-mono transition-colors ${lineChartPeriod === p ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-64 mt-4 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getLineData()} margin={{ top: 10, right: 5, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff' }}
                          formatter={(value: any) => [formatNaira(value), 'Revenue']}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="profit" name="Net Margin" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-heading font-bold">Category Performance</h3>
                    <p className="text-xs text-stone-500">Live valuation of distributed basket checkout.</p>
                  </div>
                  
                  <div className="h-44 my-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', color: '#fff' }}
                          formatter={(value: any) => formatNaira(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono">Baskets</span>
                      <span className="text-sm font-heading font-bold tabular-nums">{formatNaira(grossRevenue).split('.')[0]}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {categoryChartData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-stone-300">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-stone-400">{formatNaira(item.value).split('.')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Best-Sellers & Low Stock Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl space-y-4">
                  <h3 className="text-lg font-heading font-bold">Top Bestselling Products</h3>
                  <div className="space-y-3">
                    {getBestselling().map((p, index) => (
                      <div key={p.id} className="flex items-center justify-between border-b border-stone-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-stone-500 font-mono font-bold w-4">#{index + 1}</span>
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded" />
                          <div>
                            <span className="text-xs text-stone-400 block font-mono">{p.category}</span>
                            <span className="text-sm font-medium hover:text-amber-500 transition line-clamp-1">{p.name}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-sm font-semibold block">{formatNaira(p.price).split('.')[0]}</span>
                          <span className="text-[10px] text-stone-500">{p.reviewsCount} checked ratings</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-900 border border-stone-800 p-5 rounded-xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-heading font-bold">Enterprise Low Stock Monitor</h3>
                    <span className="bg-amber-500 text-stone-950 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold">
                      {lowStockCount} alert-active
                    </span>
                  </div>
                  <div className="space-y-3">
                    {products.filter(p => p.stock < 10).map((p) => (
                      <div key={p.id} className="flex items-center justify-between border-b border-stone-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded" />
                          <div>
                            <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-stone-400 font-mono">{p.unit}</span>
                              <span className="text-xs text-stone-500">•</span>
                              <span className="text-xs text-stone-400 font-mono bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">{p.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {p.stock < 5 ? (
                              <span className="bg-rose-900 text-rose-100 border border-rose-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                                CRITICAL: {p.stock} units
                              </span>
                            ) : (
                              <span className="bg-amber-900/40 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                                LOW: {p.stock} units
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setProducts(prev => prev.map(item => item.id === p.id ? { ...item, stock: 25 } : item));
                              const restockMsg = `RESTOCK COMPLETE: Dispatched supply reorder to supplier for '${p.name}'. Reset to 25 units.`;
                              setStockTriggerLogs(curr => [restockMsg, ...curr]);
                            }}
                            className="bg-stone-950 border border-stone-800 hover:border-amber-500 hover:text-amber-500 text-[10px] font-mono px-2 py-1 rounded transition"
                          >
                            Restock (25)
                          </button>
                        </div>
                      </div>
                    ))}
                    {products.filter(p => p.stock < 10).length === 0 && (
                      <div className="text-center py-8 text-stone-500 italic">
                        All items are fully in stock. Low inventory threshold is safe (&gt;= 10 units).
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Tab Content: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-heading font-bold">Inventory Control & Automation</h3>
                  <p className="text-xs text-stone-500 mt-1">Direct control of stock, unit packaging pricing, and instant in/out bulk toggles.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStock(true)}
                    className="bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs font-mono text-emerald-400 px-3.5 py-2 rounded-lg transition"
                  >
                    Bulk In-Stock (15)
                  </button>
                  <button
                    onClick={() => handleBulkStock(false)}
                    className="bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs font-mono text-rose-400 px-3.5 py-2 rounded-lg transition"
                  >
                    Bulk Out-of-Stock
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition text-stone-200"
                />
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto rounded-lg border border-stone-800 bg-stone-950">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-900 text-stone-400 font-mono border-b border-stone-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Price (₦)</th>
                      <th className="p-4 text-center">Qty / Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/80">
                    {filteredProducts.map(p => {
                      const isEditing = editingProductId === p.id;
                      return (
                        <tr key={p.id} className="hover:bg-stone-900/50 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded border border-stone-800" />
                              <div>
                                <span className="font-medium text-stone-200 block">{p.name}</span>
                                <span className="text-[10px] text-stone-500 font-mono block">{p.unit}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-xs bg-stone-900 text-stone-400 border border-stone-800 px-2 py-0.5 rounded">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-medium">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(Number(e.target.value))}
                                className="w-24 bg-stone-900 border border-stone-700 text-right px-2 py-1 rounded text-xs focus:outline-none focus:border-amber-500"
                              />
                            ) : (
                              formatNaira(p.price)
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editStockValue}
                                onChange={(e) => setEditStockValue(Number(e.target.value))}
                                className="w-16 bg-stone-900 border border-stone-700 text-center px-2 py-1 rounded text-xs focus:outline-none focus:border-amber-500"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-mono font-bold ${p.stock < 5 ? 'text-rose-500' : 'text-stone-200'}`}>
                                  {p.stock}
                                </span>
                                {p.stock === 0 ? (
                                  <span className="bg-rose-950 border border-rose-900 text-rose-400 px-1.5 py-0.2 rounded text-[9px] font-mono">
                                    OUT OF STOCK
                                  </span>
                                ) : (
                                  <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.2 rounded text-[9px] font-mono">
                                    IN STOCK
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => saveProductEdit(p.id)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 p-1.5 rounded transition"
                                  title="Save Changes"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="bg-stone-800 hover:bg-stone-700 text-stone-400 p-1.5 rounded transition"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => startEditing(p)}
                                  className="bg-stone-850 hover:bg-stone-800 border border-stone-800 text-amber-500 p-1.5 rounded transition"
                                  title="Edit Price & Qty"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, stock: item.stock === 0 ? 15 : 0 } : item));
                                    const logMsg = `STATUS TOGGLE: Changed availability status for '${p.name}'.`;
                                    setStockTriggerLogs(curr => [logMsg, ...curr]);
                                  }}
                                  className={`p-1.5 rounded border transition ${p.stock === 0 ? 'bg-emerald-950/40 hover:bg-emerald-900 border-emerald-800 text-emerald-400' : 'bg-rose-950/40 hover:bg-rose-900 border-rose-800 text-rose-400'}`}
                                  title={p.stock === 0 ? "Make In-Stock" : "Make Out-of-Stock"}
                                >
                                  {p.stock === 0 ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-heading font-bold">Logistics & Delivery Control Center</h3>
                <p className="text-xs text-stone-500 mt-1">Assign logistics drivers, configure delivery zones, and trigger real-time shipment progress status.</p>
              </div>

              {/* Order Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search orders by ID, shopper name, or delivery zone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition text-stone-200"
                />
              </div>

              {/* Active Orders List */}
              <div className="space-y-4">
                {filteredOrders.map(o => (
                  <div key={o.id} className="bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-4 shadow-md hover:border-amber-500/30 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/60 pb-3">
                      <div>
                        <span className="font-mono text-xs text-stone-500">Order ID</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-sm font-semibold text-amber-500">{o.id}</span>
                          <span className="text-stone-600">•</span>
                          <span className="text-xs text-stone-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {o.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded border ${
                          o.status === 'Placed' ? 'bg-indigo-950 border-indigo-800 text-indigo-400' :
                          o.status === 'Processing' ? 'bg-amber-950 border-amber-800 text-amber-400' :
                          o.status === 'Out for Delivery' ? 'bg-sky-950 border-sky-800 text-sky-400' :
                          'bg-emerald-950 border-emerald-800 text-emerald-400'
                        }`}>
                          {o.status}
                        </span>

                        {/* Order Subtotal */}
                        <span className="text-sm font-semibold font-mono bg-stone-900 border border-stone-800 px-3 py-1 rounded">
                          {formatNaira(o.total)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left: Items details */}
                      <div>
                        <h4 className="text-xs font-mono uppercase text-stone-500 tracking-wider mb-2">Baskets Details</h4>
                        <div className="space-y-1">
                          {o.items.map((it, idx) => (
                            <p key={idx} className="text-xs text-stone-300">
                              <strong className="text-stone-400">{it.quantity}x</strong> {it.product.name}
                            </p>
                          ))}
                        </div>
                        {o.couponCode && (
                          <div className="mt-2.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded inline-block">
                            Promo: {o.couponCode}
                          </div>
                        )}
                      </div>

                      {/* Middle: Shipping address & zone */}
                      <div>
                        <h4 className="text-xs font-mono uppercase text-stone-500 tracking-wider mb-2">Logistics Destination</h4>
                        <div className="space-y-1 text-xs">
                          <p className="font-medium text-stone-300">{o.address.fullName}</p>
                          <p className="text-stone-400">{o.address.street}, {o.address.city}</p>
                          <p className="text-stone-400">{o.address.phone}</p>
                        </div>
                      </div>

                      {/* Right: Driver & Milestone triggers */}
                      <div className="space-y-3.5 bg-stone-900/60 border border-stone-800/40 p-3 rounded-lg">
                        <h4 className="text-xs font-mono uppercase text-stone-400 tracking-wider">Logistics Dispatch</h4>
                        
                        {/* Driver select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-stone-500 block">Assign Driver</label>
                          <select
                            value={o.driverName || ""}
                            onChange={(e) => handleLogisticsUpdate(o.id, { driverName: e.target.value })}
                            className="bg-stone-950 border border-stone-800 text-xs px-2 py-1 rounded w-full focus:outline-none text-stone-200"
                          >
                            <option value="">-- Unassigned --</option>
                            {DRIVERS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* Zone select */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-stone-500 block">Delivery Zone</label>
                          <select
                            value={o.deliveryZone}
                            onChange={(e) => handleLogisticsUpdate(o.id, { deliveryZone: e.target.value })}
                            className="bg-stone-950 border border-stone-800 text-xs px-2 py-1 rounded w-full focus:outline-none text-stone-200"
                          >
                            {DELIVERY_ZONES.map(z => (
                              <option key={z} value={z}>{z}</option>
                            ))}
                          </select>
                        </div>

                        {/* Progress Buttons */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-stone-500 block">Milestone Trigger</label>
                          <div className="grid grid-cols-4 gap-1">
                            {(['Placed', 'Processing', 'Out for Delivery', 'Delivered'] as const).map(st => (
                              <button
                                key={st}
                                onClick={() => handleLogisticsUpdate(o.id, { status: st })}
                                className={`text-[9px] py-1 border rounded transition font-medium ${
                                  o.status === st 
                                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold' 
                                    : 'bg-stone-950 border-stone-800 hover:bg-stone-800 text-stone-400'
                                }`}
                              >
                                {st.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-heading font-bold">Registered Customer Directory</h3>
                <p className="text-xs text-stone-500 mt-1">Deep analysis of customer histories, spent logs, and customer relations communications logs.</p>
              </div>

              {/* Customer Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search customer directory..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition text-stone-200"
                />
              </div>

              {/* Customer database layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left: customer lists */}
                <div className="md:col-span-2 space-y-3">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`bg-stone-950 border p-4 rounded-xl cursor-pointer transition flex items-center justify-between ${
                        selectedCustomerId === c.id ? 'border-amber-500 shadow-amber-950/20' : 'border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center font-heading font-bold text-amber-500">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-semibold text-stone-200 block text-sm">{c.name}</span>
                          <span className="text-[11px] text-stone-400 font-mono">{c.email}</span>
                        </div>
                      </div>
                      
                      <div className="text-right font-mono">
                        <span className="text-xs text-stone-500 block">Spent Value</span>
                        <span className="text-sm font-semibold text-stone-100">{formatNaira(c.totalSpent).split('.')[0]}</span>
                        <span className="text-[10px] text-emerald-400 block">{c.orderCount} complete orders</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: selected details, logs and communications contact logger */}
                <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl space-y-4">
                  {selectedCustomerId ? (() => {
                    const c = customers.find(item => item.id === selectedCustomerId);
                    if (!c) return <p className="text-xs text-stone-500">Selected customer not found.</p>;
                    return (
                      <div className="space-y-4">
                        <div className="border-b border-stone-800 pb-3">
                          <span className="text-[10px] text-stone-500 font-mono tracking-wider uppercase block">Shopper Profile</span>
                          <h4 className="text-base font-heading font-bold mt-1">{c.name}</h4>
                          <p className="text-xs text-stone-400 font-mono mt-1">{c.phone}</p>
                          <p className="text-xs text-stone-500 font-mono mt-0.5">Joined: {c.dateJoined}</p>
                        </div>

                        {/* Internal CRM notes */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-500 font-mono uppercase">Internal Client Logs</span>
                          <div className="bg-stone-900 border border-stone-800 text-xs p-3 rounded-lg text-stone-300 font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {c.notes}
                          </div>
                        </div>

                        {/* Send message simulator */}
                        <div className="space-y-2 pt-2 border-t border-stone-800/80">
                          <span className="text-[10px] text-stone-500 font-mono uppercase">Log Communication Entry</span>
                          <textarea
                            placeholder="Type SMS details or logistics email notes to commit to logs..."
                            value={contactLogMsg}
                            onChange={(e) => setContactLogMsg(e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded p-2 text-xs focus:outline-none focus:border-amber-500 h-16 text-stone-200"
                          />
                          <button
                            onClick={() => triggerContactLog(c.id)}
                            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-heading font-bold text-xs px-3 py-1.5 rounded w-full flex items-center justify-center gap-1.5 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Commit CRM Message Log</span>
                          </button>
                          {contactLogSuccess && (
                            <p className="text-[11px] text-emerald-400 font-mono text-center animate-pulse">
                              ✓ Saved and committed logs successfully.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-center py-12 text-stone-500 text-xs italic">
                      Select a customer from the directory to view logs, spending habits, and submit CRM messages.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Tab Content: MARKETING */}
          {activeTab === 'marketing' && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-heading font-bold">Marketing & Campaigns CMS</h3>
                <p className="text-xs text-stone-500 mt-1">Control active promo banners, toggle global flash sales, adjust countdown times, and toggle floating promo popups.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Banner Hero Settings */}
                <div className="bg-stone-950 border border-stone-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h4 className="text-sm font-heading font-bold">Hero Banner Management</h4>
                    <button
                      onClick={() => setBannerSettings(p => ({ ...p, active: !p.active }))}
                      className={`text-xs px-3 py-1 rounded font-mono transition ${
                        bannerSettings.active ? 'bg-emerald-500 text-stone-950 font-bold' : 'bg-stone-900 border border-stone-800 text-stone-400'
                      }`}
                    >
                      {bannerSettings.active ? "BANNER ACTIVE" : "BANNER INACTIVE"}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 block">Hero Title Heading</label>
                      <input
                        type="text"
                        value={bannerSettings.title}
                        onChange={(e) => setBannerSettings(p => ({ ...p, title: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-stone-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 block">Hero Subtitle</label>
                      <input
                        type="text"
                        value={bannerSettings.subtitle}
                        onChange={(e) => setBannerSettings(p => ({ ...p, subtitle: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 text-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Promotional popup */}
                <div className="bg-stone-950 border border-stone-800 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h4 className="text-sm font-heading font-bold">Promotional Campaign Popups</h4>
                    <button
                      onClick={() => setPromoPopup(p => ({ ...p, active: !p.active }))}
                      className={`text-xs px-3 py-1 rounded font-mono transition ${
                        promoPopup.active ? 'bg-emerald-500 text-stone-950 font-bold' : 'bg-stone-900 border border-stone-800 text-stone-400'
                      }`}
                    >
                      {promoPopup.active ? "POPUP ACTIVE" : "POPUP INACTIVE"}
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-500 block">Campaign Announcement Body</label>
                      <textarea
                        value={promoPopup.text}
                        onChange={(e) => setPromoPopup(p => ({ ...p, text: e.target.value }))}
                        className="w-full bg-stone-900 border border-stone-800 rounded p-2.5 focus:outline-none focus:border-amber-500 h-20 text-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Flash Sale Engine timer control */}
                <div className="bg-stone-950 border border-stone-800 p-5 rounded-xl space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h4 className="text-sm font-heading font-bold">Flash Sale Urgency Engine</h4>
                    <button
                      onClick={() => setFlashSaleActive(!flashSaleActive)}
                      className={`text-xs px-3 py-1 rounded font-mono transition ${
                        flashSaleActive ? 'bg-emerald-500 text-stone-950 font-bold' : 'bg-stone-900 border border-stone-800 text-stone-400'
                      }`}
                    >
                      {flashSaleActive ? "FLASH SALE ON" : "FLASH SALE OFF"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <p className="text-stone-400">
                        When active, products marked as <code>isFlashSale</code> receive extra visual discount cards, real-time stock ticking, and countdown timers.
                      </p>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono text-stone-500">Countdown Timer (mins):</label>
                        <input
                          type="number"
                          value={flashSaleTimer}
                          onChange={(e) => setFlashSaleTimer(Number(e.target.value))}
                          className="w-20 bg-stone-900 border border-stone-800 rounded px-2 py-1 text-center font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-stone-900 p-3 rounded border border-stone-800/60 flex items-center justify-center text-center">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-500 font-mono block">Campaign Status</span>
                        <div className="flex items-center gap-2 justify-center">
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ${flashSaleActive ? 'bg-emerald-500 animate-ping' : 'bg-stone-600'}`} />
                          <span className="font-mono text-stone-300 font-bold">
                            {flashSaleActive ? "URGENCY TIMERS EMITTING LIVE FEED" : "STANDBY"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
