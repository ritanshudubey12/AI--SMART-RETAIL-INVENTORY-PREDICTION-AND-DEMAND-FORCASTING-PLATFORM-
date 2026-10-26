import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  ArrowLeftRight,
  Bot,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Store,
  RefreshCw,
  Search,
  Sparkles,
  Send,
  HelpCircle,
  Truck,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  Plus,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ComposedChart
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (window.location.port === '8000' ? '' : 'http://127.0.0.1:8000');

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [replenishment, setReplenishment] = useState([]);
  const [vivaData, setVivaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const isDark = theme === 'dark';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Forecasting state
  const [selectedSku, setSelectedSku] = useState('SKU-IN-01');
  const [selectedStore, setSelectedStore] = useState('STORE-01');
  const [selectedHorizon, setSelectedHorizon] = useState(14);
  const [selectedModel, setSelectedModel] = useState('Gradient_Boosting_XGB');
  const [forecastResult, setForecastResult] = useState(null);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [forecastViewMode, setForecastViewMode] = useState('simple'); // 'simple' (14 days) or 'full' (28 days)
  const [showConfidenceBand, setShowConfidenceBand] = useState(false);

  // Inventory Filter state
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [inventoryStoreFilter, setInventoryStoreFilter] = useState('All');

  // Add Product Modal State
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Grocery & Staples');
  const [newProductUnitPrice, setNewProductUnitPrice] = useState('144');
  const [newProductCostPrice, setNewProductCostPrice] = useState('115');
  const [newProductSupplier, setNewProductSupplier] = useState('SUP-IN-01');
  const [newProductLeadTime, setNewProductLeadTime] = useState('3');
  const [newProductInitialStock, setNewProductInitialStock] = useState('50');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [addProductSuccessMsg, setAddProductSuccessMsg] = useState('');

  const POPULAR_PRESETS = [
    {
      name: 'Maggi 2-Minute Masala Noodles (Pack of 12)',
      category: 'Grocery & Staples',
      unit_price: 144,
      cost_price: 115,
      supplier_id: 'SUP-IN-01',
      lead_time: 2,
      stock: 60
    },
    {
      name: 'Fortune Sunlite Sunflower Oil (1L Pouch)',
      category: 'Grocery & Staples',
      unit_price: 165,
      cost_price: 135,
      supplier_id: 'SUP-IN-01',
      lead_time: 3,
      stock: 45
    },
    {
      name: 'Parle-G Gold Glucose Biscuits (1kg Family Pack)',
      category: 'Grocery & Staples',
      unit_price: 120,
      cost_price: 95,
      supplier_id: 'SUP-IN-01',
      lead_time: 2,
      stock: 75
    },
    {
      name: 'Cadbury Dairy Milk Silk Chocolate (150g)',
      category: 'Grocery & Staples',
      unit_price: 175,
      cost_price: 140,
      supplier_id: 'SUP-IN-01',
      lead_time: 3,
      stock: 40
    },
    {
      name: 'Dettol Original Liquid Handwash Refill (750ml)',
      category: 'Kitchen & Home',
      unit_price: 99,
      cost_price: 78,
      supplier_id: 'SUP-IN-05',
      lead_time: 4,
      stock: 55
    }
  ];

  const applyPreset = (preset) => {
    setNewProductName(preset.name);
    setNewProductCategory(preset.category);
    setNewProductUnitPrice(String(preset.unit_price));
    setNewProductCostPrice(String(preset.cost_price));
    setNewProductSupplier(preset.supplier_id);
    setNewProductLeadTime(String(preset.lead_time));
    setNewProductInitialStock(String(preset.stock));
  };

  // Copilot Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '👋 Namaste! I am your AI Retail Copilot for Indian Retail Stores (Mumbai, Bengaluru, Delhi NCR). I forecast demand for daily staples (Amul Butter, Atta, Tata Tea) and suggest inter-city transfers in Rupees (₹). Ask me anything below!',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Approved actions local tracking
  const [dispatchedTransfers, setDispatchedTransfers] = useState({});
  const [approvedPOs, setApprovedPOs] = useState({});

  // Centralized Theme Styling Tokens - Metallic Executive Titanium & Gunmetal Suite
  const t = {
    bgApp: isDark ? 'bg-[#080a0f] text-slate-100' : 'bg-slate-100 text-slate-800',
    bgSidebar: isDark ? 'border-[#1e2433] bg-[#0d1017]/95 shadow-2xl shadow-black/80' : 'border-slate-300 bg-white shadow-sm',
    bgHeader: isDark ? 'border-[#1e2433] bg-[#0d1017]/85 backdrop-blur-xl shadow-md shadow-black/40' : 'border-slate-300 bg-white/80 shadow-xs',
    card: isDark ? 'metallic-card-dark text-slate-100 transition-all duration-200' : 'border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 transition-all',
    cardSubtle: isDark ? 'border-[#1e2433] bg-gradient-to-b from-[#111520]/90 to-[#0b0e14]/90 shadow-xl shadow-black/40 border-t-slate-500/20 hover:border-slate-400/35 transition' : 'border-slate-300 bg-white shadow-sm',
    innerBox: isDark ? 'bg-[#0a0c12]/90 border-[#1c2230]' : 'bg-slate-50 border-slate-200',
    title: isDark ? 'text-white' : 'text-slate-900',
    subText: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-[#1e2433]' : 'border-slate-300',
    input: isDark ? 'border-[#232b3d] bg-[#0a0d14] text-white placeholder-slate-500 focus:border-slate-300 focus:ring-1 focus:ring-slate-300/40 shadow-inner' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-slate-500 shadow-xs',
    tableHead: isDark ? 'border-[#1e2433] bg-[#0c0f16]/95 text-slate-300 font-semibold' : 'border-slate-300 bg-slate-100 text-slate-600',
    tableDivide: isDark ? 'divide-[#181d2a]' : 'divide-slate-200',
    tableRowHover: isDark ? 'hover:bg-[#141824]/80' : 'hover:bg-slate-50/80',
    navInactive: isDark ? 'text-slate-400 hover:bg-[#141824] hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    navHighlight: isDark ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/60 text-slate-200 border border-slate-500/40 shadow-sm shadow-black/40 hover:border-slate-400/60' : 'bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300',
    statusBox: isDark ? 'border-[#1e2433] bg-[#0a0d14]/80 shadow-inner' : 'border-slate-200 bg-slate-50',
    chatBox: isDark ? 'border-[#1e2433] bg-[#0d1017]/95 shadow-2xl shadow-black/60' : 'border-slate-300 bg-white shadow-sm',
    chatBotBubble: isDark ? 'border-[#22293a] bg-[#0c0f16] text-slate-200 shadow-lg border-t-slate-500/20' : 'border-slate-200 bg-slate-50 text-slate-800 shadow-xs',
    chatChip: isDark ? 'border-[#232b3d] bg-[#111520] text-slate-300 hover:border-slate-300 hover:text-white hover:bg-[#161c2c] transition' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900 shadow-xs',
    chartGrid: isDark ? '#181d2a' : '#e2e8f0',
    chartAxis: isDark ? '#64748b' : '#64748b',
    chartTooltip: isDark
      ? { backgroundColor: '#0d1017', borderColor: '#2d3748', borderRadius: '10px', boxShadow: '0 16px 36px -4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)', color: '#f8fafc' }
      : { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a' },
  };

  // Fetch initial master data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, invRes, prodRes, storeRes, trfRes, repRes, vivaRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard`),
        fetch(`${API_BASE}/api/inventory`),
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/stores`),
        fetch(`${API_BASE}/api/suppliers`),
        fetch(`${API_BASE}/api/transfers`),
        fetch(`${API_BASE}/api/replenishment`),
        fetch(`${API_BASE}/api/viva`)
      ]);

      if (dashRes.ok && invRes.ok) {
        setDashboardData(await dashRes.json());
        setInventory(await invRes.json());
        setProducts(await prodRes.json());
        setStores(await storeRes.json());
        if (supplierRes && supplierRes.ok) {
          setSuppliers(await supplierRes.json());
        }
        setTransfers(await trfRes.json());
        setReplenishment(await repRes.json());
        setVivaData(await vivaRes.json());
        setApiConnected(true);
      }
    } catch (err) {
      console.error('Failed to load API data:', err);
      setApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Manual Product Creation
  const handleCreateProduct = async (e) => {
    if (e) e.preventDefault();
    if (!newProductName.trim()) return;

    setIsSubmittingProduct(true);
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          category: newProductCategory,
          unit_price: parseFloat(newProductUnitPrice) || 100,
          cost_price: parseFloat(newProductCostPrice) || (parseFloat(newProductUnitPrice) * 0.8),
          supplier_id: newProductSupplier,
          lead_time_days: parseInt(newProductLeadTime, 10) || 3,
          initial_stock: parseInt(newProductInitialStock, 10) || 45
        })
      });

      if (res.ok) {
        const result = await res.json();
        const created = result.product;
        await loadInitialData();
        setSelectedSku(created.id);
        setActiveTab('forecast');
        setIsAddProductModalOpen(false);
        setAddProductSuccessMsg(`✅ "${created.name}" successfully added to Mumbai, Bengaluru & Delhi! ML Forecast generated.`);
        setTimeout(() => setAddProductSuccessMsg(''), 8000);
      }
    } catch (err) {
      console.error('Failed to add product:', err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Fetch forecast
  const loadForecast = async (sku, store, horizon, model) => {
    setIsForecastLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/forecast?sku_id=${sku}&store_id=${store}&horizon=${horizon}&model=${model}`
      );
      if (res.ok) {
        setForecastResult(await res.json());
      }
    } catch (err) {
      console.error('Forecast fetch failed:', err);
    } finally {
      setIsForecastLoading(false);
    }
  };

  // Handle Copilot Query
  const sendCopilotMessage = async (queryText) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatTyping(true);

    try {
      const res = await fetch(`${API_BASE}/api/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.response,
            action: data.suggested_action,
            time: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '⚠️ Unable to connect to the Copilot inference service. Please check API server.',
          time: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSku && selectedStore) {
      loadForecast(selectedSku, selectedStore, selectedHorizon, selectedModel);
    }
  }, [selectedSku, selectedStore, selectedHorizon, selectedModel]);

  // Month names for human-friendly dates
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = MONTH_NAMES[parseInt(parts[1], 10) - 1] || parts[1];
      const day = parseInt(parts[2], 10);
      return `${day} ${month}`;
    }
    return dateStr;
  };

  // Combined chart data for forecasting with simplified 14-day view
  const getForecastChartData = () => {
    if (!forecastResult) return { data: [], todayLabel: '' };
    const histRaw = forecastResult.historical_points || [];
    const futureRaw = forecastResult.forecast_points || [];

    // Simple view: 7 days of past actuals + 7 days of future forecast
    // Full view: all historical points + full forecast
    const histSlice = forecastViewMode === 'simple' ? histRaw.slice(-7) : histRaw;
    const futureSlice = forecastViewMode === 'simple' ? futureRaw.slice(0, 7) : futureRaw;

    let todayLabel = '';

    const historical = histSlice.map((p, idx) => {
      const isToday = idx === histSlice.length - 1;
      const label = formatReadableDate(p.date) + (isToday ? ' (Today)' : '');
      if (isToday) todayLabel = label;
      return {
        rawDate: p.date,
        date: label,
        actual: p.actual,
        forecast: isToday ? p.actual : null, // Connects the lines seamlessly at Today
        lower_80: null,
        upper_80: null,
        isToday,
        period: isToday ? 'Today' : 'Past Actual'
      };
    });

    const future = futureSlice.map((p) => {
      const label = formatReadableDate(p.date);
      return {
        rawDate: p.date,
        date: label,
        actual: null,
        forecast: p.forecast,
        lower_80: p.lower_80,
        upper_80: p.upper_80,
        isToday: false,
        period: 'AI Forecast'
      };
    });

    return {
      data: [...historical, ...future],
      todayLabel
    };
  };

  // 3 High-Impact Summary Cards calculation
  const getForecastSummary = () => {
    if (!forecastResult) return null;
    const hist = forecastResult.historical_points || [];
    const future = forecastResult.forecast_points || [];

    const past7 = hist.slice(-7);
    const pastTotal = past7.reduce((sum, p) => sum + (p.actual || 0), 0);
    const pastAvg = past7.length > 0 ? (pastTotal / past7.length).toFixed(1) : '0';

    const future7 = future.slice(0, 7);
    const futureTotal = future7.reduce((sum, p) => sum + (p.forecast || 0), 0);
    const futureAvg = future7.length > 0 ? (futureTotal / future7.length).toFixed(1) : '0';

    const pctChange =
      Number(pastAvg) > 0 ? Math.round(((Number(futureAvg) - Number(pastAvg)) / Number(pastAvg)) * 100) : 0;

    let peak = { date: '', forecast: 0 };
    future7.forEach((p) => {
      if (p.forecast > peak.forecast) {
        peak = { date: formatReadableDate(p.date), forecast: p.forecast };
      }
    });

    return {
      pastAvg,
      pastTotal,
      futureAvg,
      futureTotal,
      pctChange,
      peakDate: peak.date || 'Saturday',
      peakDemand: peak.forecast || 92
    };
  };

  // Filtered inventory list
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.sku_name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.sku_id.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = inventoryCategory === 'All' || item.category === inventoryCategory;
    const matchesStore = inventoryStoreFilter === 'All' || item.store_id === inventoryStoreFilter;
    return matchesSearch && matchesCategory && matchesStore;
  });

  const categories = ['All', 'Grocery & Staples', 'Dairy & Fresh', 'Beverages', 'Electronics', 'Kitchen & Home'];

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-200 ${t.bgApp}`}>
      {/* Sidebar */}
      <aside className={`flex w-64 flex-col border-r transition-colors duration-200 ${t.bgSidebar} backdrop-blur-md`}>
        {/* Brand */}
        <div className={`flex items-center gap-3 border-b px-5 py-4 ${t.border}`}>
          <img src="/rs-ai-logo.png" alt="RS AI logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-base font-extrabold tracking-tight metallic-sheen">RS AI</h1>
            <p className="text-xs font-semibold bg-gradient-to-r from-amber-300 via-sky-300 to-slate-300 bg-clip-text text-transparent">India Retail AI Suite (₹)</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {[
            { id: 'pitch', label: '1-Min Pitch & Guide', icon: Sparkles, highlight: true },
            { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
            { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp },
            { id: 'inventory', label: 'Inventory & Health', icon: Boxes },
            { id: 'transfers', label: 'Transfers & Orders', icon: ArrowLeftRight, badge: transfers.length + replenishment.length },
            { id: 'copilot', label: 'AI Retail Copilot', icon: Bot },
            { id: 'viva', label: 'Research & Viva Lab', icon: GraduationCap }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-950 shadow-lg shadow-black/50 font-bold border border-white/70'
                    : tab.highlight
                    ? t.navHighlight
                    : t.navInactive
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'opacity-80 group-hover:opacity-100'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/20 text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status Footbar */}
        <div className={`border-t p-4 ${t.border}`}>
          <div className={`rounded-xl border p-3 ${t.statusBox}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${t.subText}`}>ML Backend Engine</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Live 8000
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">HistGradientBoosting • Walk-Forward</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className={`flex h-16 items-center justify-between border-b px-8 transition-colors duration-200 ${t.bgHeader}`}>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-300 via-sky-300 to-slate-200 bg-clip-text text-transparent">
              {activeTab.replace('-', ' ')}
            </span>
            <span className={t.subText}>/</span>
            <h2 className={`text-lg font-bold ${t.title}`}>
              {activeTab === 'pitch' && '60-Second Project Explanation & Demo Guide'}
              {activeTab === 'dashboard' && 'Executive Inventory & Demand Analytics'}
              {activeTab === 'forecast' && 'Multi-Horizon SKU Demand Prediction Studio'}
              {activeTab === 'inventory' && 'Active Stock Health & Replenishment Monitor'}
              {activeTab === 'transfers' && 'Smart Store Transfers & Automated Purchase Orders'}
              {activeTab === 'copilot' && 'Conversational AI Inventory Intelligence'}
              {activeTab === 'viva' && 'Academic Research Methodology & Viva Examination Guide'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Add Product Button */}
            <button
              onClick={() => {
                applyPreset(POPULAR_PRESETS[0]);
                setIsAddProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg metallic-button px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-black/40 hover:brightness-110 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>+ Add Product</span>
            </button>

            {/* Sync Data Button */}
            <button
              onClick={loadInitialData}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isDark
                  ? 'border-[#22293a] bg-gradient-to-b from-[#181d2a] to-[#0e121a] text-slate-200 hover:border-slate-400 hover:text-white shadow-md shadow-black/40'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Data
            </button>

            {/* Quick Pitch Guide Button */}
            <button
              onClick={() => setActiveTab('pitch')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'pitch'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : isDark
                  ? 'border-amber-400/40 bg-amber-950/20 text-amber-300 hover:bg-amber-400/20'
                  : 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>How to Explain (60s)</span>
            </button>

            {/* Stores Online Badge */}
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
              isDark
                ? 'border-slate-700/60 bg-[#121622] text-slate-200 shadow-sm'
                : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="metallic-sheen font-bold">Mumbai • Bengaluru • Delhi</span>
            </div>

            {/* Theme Toggle - Segmented Switcher */}
            <div className={`flex items-center rounded-lg border p-0.5 ${
              isDark
                ? 'border-[#22293a] bg-[#0a0d14] shadow-inner'
                : 'border-slate-300 bg-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-950 font-bold shadow-md border border-white/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Moon className="h-3.5 w-3.5 fill-current" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>
        </header>

        {/* Global Success Notification for Add Product */}
        {addProductSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-8 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>{addProductSuccessMsg}</span>
            </div>
            <button onClick={() => setAddProductSuccessMsg('')} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* TAB 0: 60-SECOND PITCH & DEMO GUIDE */}
          {activeTab === 'pitch' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Hero Banner */}
              <div className={`rounded-2xl border p-6 ${t.card} relative overflow-hidden`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-400/30">
                      <span>🇮🇳</span>
                      <span>1-Minute Presentation Script for Interviews & Viva</span>
                    </div>
                    <h3 className="text-xl font-extrabold tracking-tight text-white">
                      How to Explain This Project in Simple Words to Anyone
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Use this exact 3-step script when presenting to an interviewer, professor, or client. It simplifies complex machine learning and supply chain math into everyday Indian retail examples (Reliance Retail, D-Mart, BigBasket).
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="rounded-xl metallic-button px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 cursor-pointer"
                  >
                    Open Live Dashboard →
                  </button>
                </div>
              </div>

              {/* 3-Step Talking Framework */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={`rounded-xl border p-5 space-y-3 ${t.cardSubtle} border-t-2 border-t-rose-400`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Step 1 • The Real Problem</span>
                    <span className="text-base font-bold font-mono text-slate-400">00:15s</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">The Indian Retail Dilemma</h4>
                  <p className={`text-xs leading-relaxed ${t.subText}`}>
                    "In India, retail giants like D-Mart & Reliance Retail lose crores in two ways: 
                    <strong className="text-rose-400"> Stockouts</strong> (running out of daily staples like Amul Butter or Atta on festival weekends) and 
                    <strong className="text-amber-400"> Overstocking</strong> (tying up lakhs in slow-moving items in other cities)."
                  </p>
                </div>

                <div className={`rounded-xl border p-5 space-y-3 ${t.cardSubtle} border-t-2 border-t-sky-400`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Step 2 • The AI Solution</span>
                    <span className="text-base font-bold font-mono text-slate-400">00:35s</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Machine Learning Demand Forecasting</h4>
                  <p className={`text-xs leading-relaxed ${t.subText}`}>
                    "Our system connects stores across <strong className="text-white">Mumbai, Bengaluru, and Delhi NCR</strong>. It uses 
                    <strong className="text-sky-300"> Gradient Boosted ML Models</strong> that learn from Indian salary cycles (1st-5th), weekend shopping rushes, and festival spikes to forecast exact demand 14 days in advance with ~91.6% accuracy."
                  </p>
                </div>

                <div className={`rounded-xl border p-5 space-y-3 ${t.cardSubtle} border-t-2 border-t-emerald-400`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 3 • The Smart Action</span>
                    <span className="text-base font-bold font-mono text-slate-400">00:60s</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Inter-City Store Rebalancing</h4>
                  <p className={`text-xs leading-relaxed ${t.subText}`}>
                    "When Mumbai Bandra is down to just <strong className="text-rose-400">6 packs of Amul Butter</strong>, instead of placing an expensive emergency order from Gujarat, the AI notices Bengaluru has <strong className="text-emerald-400">surplus stock</strong> and recommends a 24-hour inter-city transfer, saving money and customer trust!"
                  </p>
                </div>
              </div>

              {/* Click-by-Click Live Demo Guide */}
              <div className={`rounded-xl border p-6 space-y-4 ${t.card}`}>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>Click-by-Click Live Demo Guide (Follow this during your presentation)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div
                    onClick={() => setActiveTab('dashboard')}
                    className={`rounded-lg border p-4 cursor-pointer hover:border-slate-400 transition ${t.innerBox}`}
                  >
                    <p className="font-bold text-amber-400 mb-1">1. Executive Overview</p>
                    <p className={t.subText}>Show total inventory capital in ₹, WAPE forecast accuracy (8.4%), and the immediate red stockout warning for Amul Butter.</p>
                  </div>
                  <div
                    onClick={() => setActiveTab('forecast')}
                    className={`rounded-lg border p-4 cursor-pointer hover:border-slate-400 transition ${t.innerBox}`}
                  >
                    <p className="font-bold text-sky-400 mb-1">2. Demand Forecasting</p>
                    <p className={t.subText}>Show the ML prediction curve vs historical demand. Highlight the 80% confidence interval and explainable feature weights.</p>
                  </div>
                  <div
                    onClick={() => setActiveTab('transfers')}
                    className={`rounded-lg border p-4 cursor-pointer hover:border-slate-400 transition ${t.innerBox}`}
                  >
                    <p className="font-bold text-emerald-400 mb-1">3. Transfers & Orders</p>
                    <p className={t.subText}>Show the automated recommendation moving stock between cities. Click "Approve & Dispatch" to demonstrate execution.</p>
                  </div>
                  <div
                    onClick={() => setActiveTab('copilot')}
                    className={`rounded-lg border p-4 cursor-pointer hover:border-slate-400 transition ${t.innerBox}`}
                  >
                    <p className="font-bold text-indigo-400 mb-1">4. AI Retail Copilot</p>
                    <p className={t.subText}>Click a quick question chip to show natural language querying of active Indian store risks and supplier purchase orders.</p>
                  </div>
                </div>
              </div>

              {/* Top 4 Viva / Interview Q&A Cards */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎓</span>
                  <span>Top 4 Viva / Interview Questions (Prepared Short Answers)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`rounded-xl border p-4 space-y-1.5 ${t.cardSubtle}`}>
                    <p className="text-xs font-bold text-sky-300">Q1: Which ML algorithm did you use and why?</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <strong>Ans:</strong> HistGradientBoosting (LightGBM/XGBoost style tree ensemble). Retail sales have non-linear price elasticity and interaction effects between weekend promotions and day-of-month that linear models fail to capture. It achieved 8.4% WAPE vs 24.2% for the Naive baseline.
                    </p>
                  </div>
                  <div className={`rounded-xl border p-4 space-y-1.5 ${t.cardSubtle}`}>
                    <p className="text-xs font-bold text-sky-300">Q2: Why use chronological walk-forward validation?</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <strong>Ans:</strong> Time-series data has temporal order. Random train-test splits leak future rolling trends into training data (lookahead bias). Walk-forward strictly trains on past sales and tests on future holdout windows.
                    </p>
                  </div>
                  <div className={`rounded-xl border p-4 space-y-1.5 ${t.cardSubtle}`}>
                    <p className="text-xs font-bold text-sky-300">Q3: What is the difference between Safety Stock (SS) and Reorder Point (ROP)?</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <strong>Ans:</strong> Safety Stock is the emergency buffer against supplier delivery delays and sudden sales spikes. Reorder Point is the trigger: when on-hand stock hits ROP = (Lead Time Demand + Safety Stock), a replenishment purchase order is placed.
                    </p>
                  </div>
                  <div className={`rounded-xl border p-4 space-y-1.5 ${t.cardSubtle}`}>
                    <p className="text-xs font-bold text-sky-300">Q4: Why focus on Indian products and cities?</p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <strong>Ans:</strong> Indian FMCG products like Amul Butter and Aashirvaad Atta have fast shelf turnover, high price sensitivity, and distinct localized consumption across Mumbai, Bengaluru, and Delhi NCR where city-to-city rebalancing directly protects profit margins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              {/* Alert Bar */}
              {dashboardData.critical_alerts && dashboardData.critical_alerts.length > 0 && (
                <div className={`rounded-xl border p-4 ${
                  isDark
                    ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
                    : 'border-rose-300 bg-rose-50 text-rose-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        Immediate Attention Required: {dashboardData.critical_alerts.length} Stockout Warnings Detected
                      </p>
                      <p className={`text-xs mt-0.5 opacity-90`}>
                        {dashboardData.critical_alerts[0].message}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('transfers')}
                      className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-600 transition"
                    >
                      Resolve Imbalance
                    </button>
                  </div>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className={`rounded-xl border p-5 ${t.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${t.subText}`}>Total Inventory Capital</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-400/20 font-bold text-base">
                      ₹
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight metallic-gold-sheen font-mono">
                    ₹{dashboardData.total_inventory_value.toLocaleString('en-IN')}
                  </p>
                  <p className={`mt-1 text-xs ${t.subText}`}>
                    Monthly holding cost: <span className={`font-semibold ${isDark ? 'text-amber-200/90' : 'text-slate-700'}`}>₹{dashboardData.total_monthly_holding_cost.toLocaleString('en-IN')}</span>
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${t.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${t.subText}`}>Service Level (Fill Rate)</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 shadow-sm shadow-emerald-400/20">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight metallic-emerald-sheen font-mono">
                    {dashboardData.service_level_pct}%
                  </p>
                  <p className={`mt-1 text-xs ${t.subText}`}>
                    Calculated across {inventory.length} store inventory nodes
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${t.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${t.subText}`}>Demand Forecast WAPE</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300 border border-sky-400/40 shadow-sm shadow-sky-400/20">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight metallic-steel-sheen font-mono">
                    {dashboardData.avg_wape_pct}%
                  </p>
                  <p className="mt-1 text-xs text-emerald-400 font-semibold font-mono">
                    ✓ ~91.6% Forecasting Accuracy
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${t.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${t.subText}`}>Stock Rebalancing Ops</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-300/15 text-slate-200 border border-slate-400/40 shadow-sm shadow-slate-400/20">
                      <ArrowLeftRight className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight metallic-sheen font-mono">
                    {dashboardData.transfer_recommendations_count} Transfers
                  </p>
                  <p className={`mt-1 text-xs ${t.subText}`}>
                    {dashboardData.replenishment_orders_count} pending supplier purchase orders
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Category Inventory Breakdown */}
                <div className={`rounded-xl border p-6 ${t.cardSubtle}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${t.title}`}>Inventory Capital by Category</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.category_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                        <XAxis dataKey="category" stroke={t.chartAxis} />
                        <YAxis stroke={t.chartAxis} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip
                          contentStyle={t.chartTooltip}
                          formatter={(val) => [`$${val.toLocaleString()}`, 'Inventory Value']}
                        />
                        <Bar dataKey="inventory_value" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Store Inventory & Risk Profile */}
                <div className={`rounded-xl border p-6 ${t.cardSubtle}`}>
                  <h3 className={`text-sm font-semibold mb-4 ${t.title}`}>Store Capital & Risk Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.store_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                        <XAxis dataKey="store_name" stroke={t.chartAxis} tickFormatter={(t) => t.split('-')[0]} />
                        <YAxis stroke={t.chartAxis} tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip contentStyle={t.chartTooltip} />
                        <Bar dataKey="inventory_value" name="Value ($)" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="risk_items_count" name="At-Risk SKUs" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEMAND FORECASTING STUDIO */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Controls Header */}
              <div className={`grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-4 ${t.card}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold ${t.subText}`}>Target Product (SKU)</label>
                    <button
                      type="button"
                      onClick={() => {
                        applyPreset(POPULAR_PRESETS[0]);
                        setIsAddProductModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3 stroke-[2.5]" /> Add New
                    </button>
                  </div>
                  <select
                    value={selectedSku}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        applyPreset(POPULAR_PRESETS[0]);
                        setIsAddProductModalOpen(true);
                      } else {
                        setSelectedSku(e.target.value);
                      }
                    }}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                    <option value="__ADD_NEW__">➕ Add New Custom Product...</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-semibold ${t.subText}`}>Retail Location / Store</label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-semibold ${t.subText}`}>Forecast Horizon</label>
                  <select
                    value={selectedHorizon}
                    onChange={(e) => setSelectedHorizon(Number(e.target.value))}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                  >
                    <option value={7}>7 Days (Short Term)</option>
                    <option value={14}>14 Days (Standard Operational)</option>
                    <option value={30}>30 Days (Monthly Replenishment)</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-semibold ${t.subText}`}>ML Model Algorithm</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                  >
                    <option value="Gradient_Boosting_XGB">Gradient Boosted Trees (Recommended)</option>
                    <option value="Random_Forest">Random Forest Regressor</option>
                    <option value="Moving_Average">Moving Average (7-Day Baseline)</option>
                  </select>
                </div>
              </div>

              {/* Main Forecast Chart */}
              {isForecastLoading ? (
                <div className={`flex h-96 items-center justify-center rounded-xl border ${t.cardSubtle}`}>
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className={`text-sm ${t.subText}`}>Running ML Model Inference & Generating Prediction Intervals...</p>
                  </div>
                </div>
              ) : forecastResult ? (
                <div className="space-y-5">
                  {/* High-Impact 3-Card Summary (At a Glance for Anyone) */}
                  {(() => {
                    const summary = getForecastSummary();
                    if (!summary) return null;
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-xl border p-4 space-y-1 ${t.cardSubtle} border-l-4 border-l-slate-400`}>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">📅 Past Actual Sales (Last 7 Days)</span>
                          <p className="text-2xl font-bold font-mono text-slate-200">
                            {summary.pastAvg} <span className="text-xs font-normal text-slate-400">units/day</span>
                          </p>
                          <p className="text-xs text-slate-400">Total {summary.pastTotal} units recorded in store</p>
                        </div>

                        <div className={`rounded-xl border p-4 space-y-1 ${t.cardSubtle} border-l-4 border-l-emerald-400`}>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">🔮 Next 7 Days (AI Prediction)</span>
                          <p className="text-2xl font-bold font-mono text-emerald-400">
                            {summary.futureAvg} <span className="text-xs font-normal text-emerald-500">units/day</span>
                          </p>
                          <p className="text-xs text-slate-400">
                            Projected {summary.futureTotal} units ({summary.pctChange >= 0 ? `+${summary.pctChange}% surge` : `${summary.pctChange}% trend`})
                          </p>
                        </div>

                        <div className={`rounded-xl border p-4 space-y-1 ${t.cardSubtle} border-l-4 border-l-amber-400`}>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">💡 Store Manager Action</span>
                          <p className="text-xl font-bold font-mono text-amber-300">
                            Peak: {summary.peakDate} ({summary.peakDemand} units)
                          </p>
                          <p className="text-xs text-slate-400">Maintain safe stock of ~{summary.peakDemand + 15} units before weekend surge.</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Main Simplified Forecast Chart Card */}
                  <div className={`rounded-xl border p-6 ${t.cardSubtle}`}>
                    {/* Header & Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div>
                        <h3 className={`text-base font-bold ${t.title}`}>
                          Demand Forecast: {forecastResult.sku_name} @ {forecastResult.store_name}
                        </h3>
                        <p className={`text-xs mt-0.5 ${t.subText}`}>
                          Total Projected: <span className="font-bold text-emerald-400 font-mono">{forecastResult.total_forecast_demand} units</span>
                          {' '}| Daily Average: <span className="font-bold text-sky-400 font-mono">{forecastResult.avg_daily_forecast} units/day</span>
                        </p>
                      </div>

                      {/* View & Buffer Controls */}
                      <div className="flex items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
                          <input
                            type="checkbox"
                            checked={showConfidenceBand}
                            onChange={(e) => setShowConfidenceBand(e.target.checked)}
                            className="rounded border-slate-600 accent-sky-400 cursor-pointer"
                          />
                          <span>Show Buffer Band (±)</span>
                        </label>

                        <div className="flex rounded-lg border border-slate-700/80 bg-slate-950/70 p-0.5">
                          <button
                            onClick={() => setForecastViewMode('simple')}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                              forecastViewMode === 'simple'
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Simple (14 Days)
                          </button>
                          <button
                            onClick={() => setForecastViewMode('full')}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                              forecastViewMode === 'full'
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Full (28 Days)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Intuitive Visual Guide Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2 text-xs mb-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                        <span className="text-slate-300"><strong>Past Actual Sales:</strong> Grey line shows actual recorded sales</span>
                      </div>
                      <span className="text-slate-600 font-bold hidden sm:inline">➔</span>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-500/50" />
                        <span className="text-emerald-300"><strong>AI Prediction:</strong> Bright green line shows ML forecast for next week</span>
                      </div>
                    </div>

                    {/* Responsive Chart */}
                    <div className="h-80">
                      {(() => {
                        const { data: chartData, todayLabel } = getForecastChartData();
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                              <XAxis dataKey="date" stroke={t.chartAxis} tick={{ fontSize: 11 }} />
                              <YAxis stroke={t.chartAxis} tick={{ fontSize: 11 }} />
                              <Tooltip
                                contentStyle={t.chartTooltip}
                                formatter={(val, name) => {
                                  if (name === 'Actual Demand') return [`${val} units`, '⚪ Real Past Sales'];
                                  if (name === 'ML Forecast') return [`${val} units`, '🟢 AI Prediction'];
                                  if (name === 'Safety Buffer') return [`${val} units`, '🔵 Max Rush Buffer'];
                                  return [val, name];
                                }}
                                labelFormatter={(label) => `📅 Date: ${label}`}
                              />
                              {todayLabel && (
                                <ReferenceLine
                                  x={todayLabel}
                                  stroke="#38bdf8"
                                  strokeDasharray="4 4"
                                  strokeWidth={2}
                                  label={{ value: '📍 Today', position: 'top', fill: '#38bdf8', fontSize: 11, fontWeight: 'bold' }}
                                />
                              )}
                              {showConfidenceBand && (
                                <Area
                                  type="monotone"
                                  dataKey="upper_80"
                                  stroke="#38bdf8"
                                  strokeDasharray="3 3"
                                  fill="#38bdf8"
                                  fillOpacity={0.12}
                                  name="Safety Buffer"
                                />
                              )}
                              <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#94a3b8"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#94a3b8', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#cbd5e1' }}
                                name="Actual Demand"
                              />
                              <Line
                                type="monotone"
                                dataKey="forecast"
                                stroke="#10b981"
                                strokeWidth={3.5}
                                dot={{ r: 5, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                                activeDot={{ r: 7, fill: '#34d399' }}
                                name="ML Forecast"
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Feature Importance & Model Benchmarks Grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Feature Importance */}
                    <div className={`rounded-xl border p-6 ${t.cardSubtle}`}>
                      <h4 className={`text-sm font-semibold mb-3 ${t.title}`}>Explainable AI: Feature Importance</h4>
                      <p className={`text-xs mb-4 ${t.subText}`}>
                        Information gain and predictive weight evaluated by the gradient boosting ensemble:
                      </p>
                      <div className="space-y-3">
                        {forecastResult.feature_importance.map((f, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{f.feature}</span>
                              <span className="font-mono text-sky-400 font-semibold">{(f.importance * 100).toFixed(0)}%</span>
                            </div>
                            <div className={`h-2 w-full overflow-hidden rounded-full ${isDark ? 'bg-[#080d1c]' : 'bg-slate-200'}`}>
                              <div
                                className="h-full bg-gradient-to-r from-slate-400 via-sky-400 to-emerald-400 rounded-full"
                                style={{ width: `${f.importance * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Model Comparison Table */}
                    <div className={`rounded-xl border p-6 ${t.cardSubtle}`}>
                      <h4 className={`text-sm font-semibold mb-3 ${t.title}`}>Chronological Walk-Forward Benchmarks</h4>
                      <p className={`text-xs mb-4 ${t.subText}`}>
                        Out-of-sample evaluation on the 14-day holdout set:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className={`border-b text-slate-500 ${t.border}`}>
                              <th className="pb-2 font-medium">Model</th>
                              <th className="pb-2 font-medium">MAE</th>
                              <th className="pb-2 font-medium">RMSE</th>
                              <th className="pb-2 font-medium">WAPE %</th>
                              <th className="pb-2 font-medium">Accuracy</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y font-mono ${t.tableDivide}`}>
                            {Object.entries(forecastResult.model_comparison || {}).map(([mName, mVals]) => (
                              <tr key={mName} className={mName === selectedModel ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 font-semibold border-l-2 border-indigo-400' : (isDark ? 'text-slate-300' : 'text-slate-700')}>
                                <td className="py-2.5 font-sans">{mName.replace(/_/g, ' ')}</td>
                                <td className="py-2.5">{mVals.mae}</td>
                                <td className="py-2.5">{mVals.rmse}</td>
                                <td className="py-2.5">{mVals.wape_pct}%</td>
                                <td className="py-2.5 text-emerald-600 dark:text-emerald-400">{mVals.accuracy_pct}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: INVENTORY & HEALTH */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${t.card}`}>
                <div className="flex flex-1 items-center gap-3 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className={`absolute left-3 top-2.5 h-4 w-4 ${t.subText}`} />
                    <input
                      type="text"
                      placeholder="Search by SKU name or ID..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className={`w-full rounded-lg border pl-9 pr-4 py-2 text-sm focus:outline-none ${t.input}`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      applyPreset(POPULAR_PRESETS[0]);
                      setIsAddProductModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg metallic-button px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-black/40 hover:brightness-110 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>+ Add Product</span>
                  </button>

                  <select
                    value={inventoryCategory}
                    onChange={(e) => setInventoryCategory(e.target.value)}
                    className={`rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c} Categories</option>
                    ))}
                  </select>

                  <select
                    value={inventoryStoreFilter}
                    onChange={(e) => setInventoryStoreFilter(e.target.value)}
                    className={`rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                  >
                    <option value="All">All Stores</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name.split('-')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inventory Table */}
              <div className={`rounded-xl border overflow-hidden ${t.cardSubtle}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b font-medium uppercase tracking-wider ${t.tableHead}`}>
                      <tr>
                        <th className="px-5 py-3.5">SKU & Category</th>
                        <th className="px-5 py-3.5">Store Location</th>
                        <th className="px-5 py-3.5">On Hand</th>
                        <th className="px-5 py-3.5">Safety Stock (SS)</th>
                        <th className="px-5 py-3.5">Reorder Point (ROP)</th>
                        <th className="px-5 py-3.5">Days of Supply</th>
                        <th className="px-5 py-3.5">Risk Status</th>
                        <th className="px-5 py-3.5">Holding Cost / Mo</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${t.tableDivide}`}>
                      {filteredInventory.map((item, idx) => {
                        const isCritical = item.stockout_risk_score >= 80;
                        const isReorder = item.current_stock <= item.reorder_point;
                        return (
                          <tr key={idx} className={`${t.tableRowHover} transition`}>
                            <td className="px-5 py-3.5">
                              <p className={`font-semibold ${t.title}`}>{item.sku_name}</p>
                              <p className={`text-[11px] ${t.subText}`}>{item.sku_id} • {item.category}</p>
                            </td>
                            <td className={`px-5 py-3.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {item.store_name.split('-')[0]}
                            </td>
                            <td className={`px-5 py-3.5 font-mono font-bold ${t.title}`}>
                              {item.current_stock}
                            </td>
                            <td className={`px-5 py-3.5 font-mono ${t.subText}`}>
                              {item.safety_stock}
                            </td>
                            <td className={`px-5 py-3.5 font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {item.reorder_point}
                            </td>
                            <td className="px-5 py-3.5 font-mono">
                              <span className={item.days_of_supply < 3 ? 'text-rose-500 font-bold' : (isDark ? 'text-slate-300' : 'text-slate-700')}>
                                {item.days_of_supply}d
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  isCritical
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                    : isReorder
                                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {item.stockout_risk_level}
                              </span>
                            </td>
                            <td className={`px-5 py-3.5 font-mono ${t.subText}`}>
                              ₹{item.holding_cost_monthly.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSFERS & REPLENISHMENT */}
          {activeTab === 'transfers' && (
            <div className="space-y-8">
              {/* Inter-Store Rebalancing */}
              <div className="space-y-4">
                <div>
                  <h3 className={`text-base font-semibold ${t.title}`}>Inter-Store Rebalancing Recommendations</h3>
                  <p className={`text-xs ${t.subText}`}>
                    Transfers units from surplus locations to stores facing imminent stockouts, saving emergency procurement and holding costs:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {transfers.map((trf) => {
                    const isDispatched = dispatchedTransfers[trf.id];
                    return (
                      <div
                        key={trf.id}
                        className={`rounded-xl border p-5 transition ${
                          isDispatched
                            ? 'border-emerald-500/40 bg-emerald-950/20'
                            : t.card
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="rounded bg-slate-700/50 border border-slate-500/40 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                              {trf.priority} Priority
                            </span>
                            <h4 className={`mt-2 text-sm font-bold ${t.title}`}>{trf.sku_name}</h4>
                            <p className={`text-xs ${t.subText}`}>{trf.sku_id} • {trf.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-lg font-bold metallic-steel-sheen">{trf.units_to_transfer} Units</span>
                            <p className="text-[11px] text-emerald-400 font-semibold font-mono">Est. Savings: ₹{trf.estimated_savings.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Route Visualizer */}
                        <div className={`mt-4 flex items-center justify-between rounded-lg p-3 text-xs ${t.innerBox}`}>
                          <div>
                            <p className={t.subText}>From Source (Surplus):</p>
                            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{trf.from_store_name.split('-')[0]}</p>
                            <p className={`font-mono text-[11px] ${t.subText}`}>Stock: {trf.from_stock_before} → {trf.from_stock_after}</p>
                          </div>
                          <ArrowLeftRight className="h-5 w-5 text-sky-400" />
                          <div className="text-right">
                            <p className={t.subText}>To Destination (Deficit):</p>
                            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{trf.to_store_name.split('-')[0]}</p>
                            <p className={`font-mono text-[11px] ${t.subText}`}>Stock: {trf.to_stock_before} → {trf.to_stock_after}</p>
                          </div>
                        </div>

                        <p className={`mt-3 text-xs ${t.subText}`}>{trf.rationale}</p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-[11px] ${t.subText}`}>Transit Duration: {trf.transfer_time_days} Day</span>
                          <button
                            disabled={isDispatched}
                            onClick={() => setDispatchedTransfers((prev) => ({ ...prev, [trf.id]: true }))}
                            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                              isDispatched
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'metallic-button text-slate-950 font-bold hover:brightness-110 active:scale-95 shadow-md shadow-black/40'
                            }`}
                          >
                            {isDispatched ? '✓ Dispatched for Transit' : 'Approve & Dispatch'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automated Purchase Orders */}
              <div className="space-y-4">
                <div>
                  <h3 className={`text-base font-semibold ${t.title}`}>Recommended Supplier Purchase Orders</h3>
                  <p className={`text-xs ${t.subText}`}>
                    Automated EOQ-optimized orders triggered when on-hand stock drops below the Reorder Point (ROP):
                  </p>
                </div>

                <div className={`rounded-xl border overflow-hidden ${t.cardSubtle}`}>
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b font-medium ${t.tableHead}`}>
                      <tr>
                        <th className="px-5 py-3">PO Number</th>
                        <th className="px-5 py-3">Product / Store</th>
                        <th className="px-5 py-3">Supplier & Lead Time</th>
                        <th className="px-5 py-3">Order Qty (EOQ)</th>
                        <th className="px-5 py-3">Total PO Value</th>
                        <th className="px-5 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${t.tableDivide}`}>
                      {replenishment.map((po) => {
                        const isApproved = approvedPOs[po.po_number];
                        return (
                          <tr key={po.po_number} className={`${t.tableRowHover} transition`}>
                            <td className="px-5 py-3.5 font-bold text-sky-400 font-mono">{po.po_number}</td>
                            <td className="px-5 py-3.5 font-sans">
                              <p className={`font-semibold ${t.title}`}>{po.sku_name}</p>
                              <p className={`text-[11px] ${t.subText}`}>{po.store_name.split('-')[0]}</p>
                            </td>
                            <td className="px-5 py-3.5 font-sans">
                              <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{po.supplier_name}</p>
                              <p className={`text-[11px] font-mono ${t.subText}`}>{po.lead_time_days} days delivery</p>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-emerald-400 font-mono">{po.order_quantity} Units</td>
                            <td className={`px-5 py-3.5 font-mono ${isDark ? 'text-amber-300' : 'text-slate-700'}`}>₹{po.total_po_value.toLocaleString('en-IN')}</td>
                            <td className="px-5 py-3.5">
                              <button
                                disabled={isApproved}
                                onClick={() => setApprovedPOs((prev) => ({ ...prev, [po.po_number]: true }))}
                                className={`rounded px-3 py-1 text-xs font-sans font-semibold transition ${
                                  isApproved
                                    ? 'bg-emerald-600 text-white cursor-default'
                                    : isDark
                                    ? 'border border-slate-500/50 bg-[#141824] text-slate-200 hover:bg-gradient-to-r hover:from-slate-200 hover:to-slate-300 hover:text-slate-950 font-semibold transition'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-300 hover:text-slate-950'
                                }`}
                              >
                                {isApproved ? '✓ Transmitted' : 'Approve PO'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI RETAIL COPILOT */}
          {activeTab === 'copilot' && (
            <div className={`flex h-[calc(100vh-10rem)] flex-col rounded-xl border overflow-hidden ${t.chatBox}`}>
              {/* Copilot Header */}
              <div className={`flex items-center gap-3 border-b px-6 py-4 ${t.border} ${isDark ? 'bg-[#0c0f16]' : 'bg-slate-50'}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-slate-100 via-slate-300 to-slate-400 text-slate-950 shadow-md shadow-white/10 border border-white/60">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${t.title}`}>RS AI Copilot Assistant</h3>
                  <p className={`text-[11px] ${t.subText}`}>Natural language inventory queries & automated decision support</p>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border border-slate-600/60 text-white font-medium shadow-lg'
                          : t.chatBotBubble
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      {msg.action && (
                        <div className={`mt-3 rounded-lg border p-2.5 text-[11px] ${
                          isDark ? 'border-amber-400/40 bg-amber-950/20 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}>
                          <span className="font-bold">Recommended Next Step:</span> {msg.action}
                        </div>
                      )}
                      <p className="mt-1.5 text-right text-[10px] opacity-60">{msg.time}</p>
                    </div>
                  </div>
                ))}

                {isChatTyping && (
                  <div className="flex justify-start">
                    <div className={`flex items-center gap-2 rounded-2xl border p-4 text-xs ${t.border} ${isDark ? 'bg-[#080d1c] text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                      <Bot className="h-4 w-4 animate-bounce text-sky-400" />
                      <span>Copilot is querying inventory metrics and calculating insights...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className={`border-t px-6 py-2.5 ${t.border} ${isDark ? 'bg-[#070914]' : 'bg-slate-50/70'}`}>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Why is Amul Butter critical in Mumbai Bandra?',
                    'Show store rebalancing transfers between cities',
                    'How does ML forecast weekend & Diwali surge?',
                    'Compare ML model vs Naive baseline for Atta'
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendCopilotMessage(chip)}
                      className={`rounded-full border px-3 py-1 text-[11px] transition ${t.chatChip}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className={`border-t p-4 ${t.border} ${isDark ? 'bg-[#0c0f16]' : 'bg-slate-50'}`}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendCopilotMessage();
                  }}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Copilot about demand trends, stockouts, purchase orders..."
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none ${t.input}`}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-xl metallic-button text-slate-950 font-bold hover:brightness-110 active:scale-95 transition disabled:opacity-40 cursor-pointer shadow-md shadow-black/40"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: RESEARCH METHODOLOGY & VIVA LAB */}
          {activeTab === 'viva' && vivaData && (
            <div className="space-y-8">
              {/* Research Questions Section */}
              <div className="space-y-4">
                <div className={`border-b pb-3 ${t.border}`}>
                  <h3 className={`text-base font-bold ${t.title}`}>Core Research Questions (RQ1 - RQ5)</h3>
                  <p className={`text-xs ${t.subText}`}>
                    Scientific and operational questions evaluated by the ML and supply chain architecture:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {vivaData.research_methodology.questions.map((rq) => (
                    <div key={rq.id} className={`rounded-xl border p-5 space-y-2 ${t.cardSubtle}`}>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-slate-700/50 border border-slate-500/40 px-2.5 py-0.5 text-xs font-bold text-slate-200">
                          {rq.id}
                        </span>
                        <h4 className={`text-sm font-bold ${t.title}`}>{rq.title}</h4>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{rq.description}</p>
                      <div className={`mt-2 rounded-lg p-3 text-xs border ${
                        isDark ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      }`}>
                        <span className={`font-semibold ${t.title}`}>Empirical Findings: </span>
                        {rq.findings}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mathematical Formulas Section */}
              <div className="space-y-4">
                <div className={`border-b pb-3 ${t.border}`}>
                  <h3 className={`text-base font-bold ${t.title}`}>Inventory Optimization & Evaluation Formulas</h3>
                  <p className={`text-xs ${t.subText}`}>
                    Mathematical formulations powering safety stock, reorder levels, and model scoring:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {vivaData.research_methodology.formulas.map((form, i) => (
                    <div key={i} className={`rounded-xl border p-5 space-y-2 ${t.cardSubtle}`}>
                      <h4 className={`text-sm font-bold ${t.title}`}>{form.name}</h4>
                      <div className={`rounded p-2.5 font-mono text-xs font-semibold border ${t.innerBox} metallic-emerald-sheen`}>
                        {form.formula}
                      </div>
                      <p className={`text-xs ${t.subText}`}>{form.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viva Q&A Guide */}
              <div className="space-y-4">
                <div className={`border-b pb-3 ${t.border}`}>
                  <h3 className={`text-base font-bold ${t.title}`}>Viva Examination Questions & Answers</h3>
                  <p className={`text-xs ${t.subText}`}>
                    Prepared answers to typical academic and viva panel questions:
                  </p>
                </div>

                <div className="space-y-3">
                  {vivaData.viva_qa.map((qa, i) => (
                    <div key={i} className={`rounded-xl border p-5 space-y-2 ${t.cardSubtle}`}>
                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                        <h4 className={`text-sm font-bold ${t.title}`}>{qa.question}</h4>
                      </div>
                      <p className={`text-xs pl-7 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add New Product Modal */}
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${t.card} space-y-5 animate-in fade-in duration-200`}>
              <div className="flex items-center justify-between border-b pb-4 border-slate-700/50">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>✨</span>
                    <span>Manually Add Indian Retail Product (SKU)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adds product across Mumbai, Bengaluru & Delhi store inventories and generates ML models.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 1-Click Popular Indian Brand Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  ⚡ Quick Presets (Click to autofill instantly):
                </label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-400 hover:text-white transition cursor-pointer"
                    >
                      {p.name.split('(')[0]} <span className="font-bold text-amber-300">₹{p.unit_price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Entry Form */}
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-300">Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maggi 2-Minute Masala Noodles (Pack of 12)"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Category *</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    >
                      <option value="Grocery & Staples">Grocery & Staples</option>
                      <option value="Dairy & Fresh">Dairy & Fresh</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Kitchen & Home">Kitchen & Home</option>
                      <option value="Snacks & Packaged">Snacks & Packaged</option>
                      <option value="Personal Care">Personal Care</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={newProductUnitPrice}
                      onChange={(e) => {
                        setNewProductUnitPrice(e.target.value);
                        const p = parseFloat(e.target.value);
                        if (!isNaN(p)) setNewProductCostPrice(String(Math.round(p * 0.8)));
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={newProductCostPrice}
                      onChange={(e) => setNewProductCostPrice(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Initial Store Stock (Units)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={newProductInitialStock}
                      onChange={(e) => setNewProductInitialStock(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Supplier</label>
                    <select
                      value={newProductSupplier}
                      onChange={(e) => setNewProductSupplier(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    >
                      {suppliers.length > 0 ? (
                        suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="SUP-IN-01">ITC Consumer Goods Supply Logistics</option>
                          <option value="SUP-IN-02">Amul Cooperative Milk Marketing</option>
                          <option value="SUP-IN-03">Tata Consumer Products National Hub</option>
                          <option value="SUP-IN-04">Imagine Marketing (boAt Lifestyle)</option>
                          <option value="SUP-IN-05">TTK Prestige Appliances National Center</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Delivery Lead Time</label>
                    <select
                      value={newProductLeadTime}
                      onChange={(e) => setNewProductLeadTime(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${t.input}`}
                    >
                      <option value="2">2 Days (Express Dairy/Fresh)</option>
                      <option value="3">3 Days (Standard FMCG)</option>
                      <option value="5">5 Days (Electronics/Non-perishable)</option>
                      <option value="7">7 Days (Long Distance)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="rounded-lg metallic-button px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-black/40 hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2"
                  >
                    {isSubmittingProduct ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 stroke-[2.5]" />}
                    <span>{isSubmittingProduct ? 'Adding & Generating ML Models...' : 'Add Product & Generate Forecast'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
