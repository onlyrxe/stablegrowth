import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid } from 'recharts';
import { TrendingUp, Settings, ChevronDown, Check, Coins, Filter } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils/helpers';
import { format, parseISO } from 'date-fns';

const STOCKS = ['FPT', 'HPG', 'VCB', 'TCB', 'MWG', 'VIC', 'VHM', 'SSI', 'REE', 'GEX', 'VNM', 'MSN', 'ACB', 'CTG', 'BID', 'HDB', 'MBB', 'VPB', 'POW', 'SAB', 'VRE', 'VJC', 'BVH', 'PLX', 'GAS'];

const ASSET_TYPES = [
  { id: 'stocks', name: 'Chứng khoán', color: '#10b981' },
  { id: 'savings', name: 'Tiết kiệm', color: '#3b82f6' },
  { id: 'cash', name: 'Tiền mặt', color: '#f59e0b' },
  { id: 'gold', name: 'Vàng', color: '#ef4444' },
  { id: 'usd', name: 'USD', color: '#8b5cf6' },
];

const Investments = () => {
  const { investments, settings, updateSettings, isDarkMode } = useFinance();
  const [isStockSelectorOpen, setIsStockSelectorOpen] = useState(false);
  const [selectedAssetFilters, setSelectedAssetFilters] = useState(ASSET_TYPES.map(a => a.id));

  const historyData = useMemo(() => {
    return [...investments].reverse().map(inv => {
      const data = {
        month: format(parseISO(inv.date), 'MM/yy'),
        total: inv.currentValue || inv.investedAmount,
      };
      
      ASSET_TYPES.forEach(asset => {
        const percentage = inv.allocation?.[asset.id] || 0;
        data[asset.id] = Math.floor(data.total * (percentage / 100));
      });
      
      return data;
    });
  }, [investments]);

  const toggleAssetFilter = (id) => {
    setSelectedAssetFilters(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(a => a !== id) : prev) 
        : [...prev, id]
    );
  };

  const allocationData = useMemo(() => [
    { id: 'stocks', name: 'Chứng khoán', value: settings.allocation.stocks, color: '#10b981' },
    { id: 'savings', name: 'Tiết kiệm', value: settings.allocation.savings, color: '#3b82f6' },
    { id: 'cash', name: 'Tiền mặt', value: settings.allocation.cash, color: '#f59e0b' },
    { id: 'gold', name: 'Vàng', value: settings.allocation.gold, color: '#ef4444' },
    { id: 'usd', name: 'USD', value: settings.allocation.usd, color: '#8b5cf6' },
  ], [settings.allocation]);

  const handleAllocationChange = (key, value) => {
    const val = parseFloat(value) || 0;
    const otherSum = Object.entries(settings.allocation)
      .filter(([k]) => k !== key)
      .reduce((sum, [, v]) => sum + v, 0);
    
    if (otherSum + val <= 100) {
      updateSettings({ allocation: { ...settings.allocation, [key]: val } });
    }
  };

  const toggleStock = (ticker) => {
    let current = [...settings.selectedStocks];
    if (current.includes(ticker)) {
      current = current.filter(t => t !== ticker);
    } else if (current.length < 5) {
      current.push(ticker);
    }
    updateSettings({ selectedStocks: current });
  };

  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.investedAmount), 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const profit = totalCurrentValue - totalInvested;

  // Generate mock daily data for the 5 asset charts
  const dailyData = useMemo(() => {
    return ASSET_TYPES.map(asset => {
      const baseValue = historyData[historyData.length - 1]?.[asset.id] || 10000000;
      const data = [];
      for (let i = 0; i < 30; i++) {
        const date = format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), 'dd/MM');
        // Random walk for price movement
        const prevValue = i === 0 ? baseValue : data[i - 1].value;
        const volatility = asset.id === 'stocks' ? 0.08 : asset.id === 'gold' ? 0.04 : 0.02;
        const change = (Math.random() - 0.45) * volatility; // More dramatic swings
        data.push({ date, value: Math.floor(prevValue * (1 + change)) });
      }
      return { ...asset, data };
    });
  }, [historyData]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h1 className={cn("text-xl font-bold tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>Đầu tư tự động</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500 font-medium tracking-tight">Đầu tư vào ngày</p>
            <select 
              value={settings.investmentDay || 25}
              onChange={(e) => updateSettings({ investmentDay: parseInt(e.target.value) })}
              className={cn(
                "text-lg font-black rounded-xl py-1.5 px-4 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm mx-1 border-none",
                isDarkMode ? "bg-emerald-950 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              )}
            >
              {[...Array(28)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <p className="text-sm text-slate-500 font-medium tracking-tight">hàng tháng.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings & Allocation - Main Content */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 space-y-6">
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm space-y-8",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDarkMode ? "bg-slate-800 text-emerald-400" : "bg-emerald-100 text-emerald-600")}>
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                   <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-100" : "text-slate-800")}>Cấu hình phân bổ</h3>
                   <p className="text-[10px] text-slate-400 font-medium">Điều chỉnh tỷ trọng đầu tư định kỳ</p>
                </div>
              </div>
              <div className={cn(
                "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border",
                isDarkMode ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}>
                Hiệu lực: {Object.values(settings.allocation).reduce((a, b) => a + b, 0)}%
              </div>
            </div>

            <div className={cn("text-[10px] font-medium italic text-slate-400 pl-1", isDarkMode ? "text-slate-500" : "text-slate-400")}>
               * Dữ liệu được cập nhật tự động khi thay đổi thiết lập
            </div>

            <div className="space-y-8">
              {Object.entries(settings.allocation).map(([key, value]) => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className={cn("text-[11px] font-bold uppercase tracking-tighter", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                      {key === 'stocks' ? 'Chứng khoán' : key === 'savings' ? 'Tiết kiệm' : key === 'gold' ? 'Vàng' : key === 'cash' ? 'Tiền mặt' : 'USD'}
                    </span>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleAllocationChange(key, Math.max(0, value - 1))}
                         className={cn("w-6 h-6 flex items-center justify-center rounded-md font-bold", isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                       >-</button>
                       <div className="relative">
                        <input 
                          type="number"
                          value={value}
                          onChange={(e) => handleAllocationChange(key, e.target.value)}
                          className={cn(
                            "w-12 text-center text-xs font-black rounded-md py-1 border-none focus:ring-1 focus:ring-emerald-500",
                            isDarkMode ? "bg-slate-800 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                          )}
                        />
                        <span className="absolute right-1 top-1 text-[8px] font-bold text-emerald-300 opacity-50">%</span>
                       </div>
                       <button 
                         onClick={() => handleAllocationChange(key, Math.min(100, value + 1))}
                         className={cn("w-6 h-6 flex items-center justify-center rounded-md font-bold", isDarkMode ? "bg-slate-800 text-slate-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                       >+</button>
                    </div>
                  </div>
                  <div className={cn("relative h-1.5 w-full rounded-full", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        key === 'stocks' ? 'bg-emerald-500' : key === 'savings' ? 'bg-emerald-400' : 'bg-emerald-300'
                      )}
                    />
                    <input 
                      type="range" min="0" max="100" value={value} 
                      onChange={(e) => handleAllocationChange(key, e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full shadow-sm pointer-events-none transition-all duration-300", 
                        isDarkMode ? "bg-slate-900 border-emerald-500" : "bg-white border-emerald-500")}
                      style={{ left: `calc(${value}% - 8px)` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={cn("pt-6 border-t space-y-4", isDarkMode ? "border-slate-800" : "border-slate-50")}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Danh mục chứng khoán</h3>
                <span className="text-xs text-slate-400 italic">{settings.selectedStocks.length}/5 mã</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {STOCKS.map(ticker => (
                  <button
                    key={ticker}
                    onClick={() => toggleStock(ticker)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black transition-all border-2",
                      settings.selectedStocks.includes(ticker)
                        ? (isDarkMode ? "bg-slate-100 border-slate-100 text-slate-900 shadow-md scale-105" : "bg-slate-900 border-slate-900 text-white shadow-md scale-105")
                        : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300")
                    )}
                  >
                    {ticker}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Growth Chart Section */}
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm space-y-6",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isDarkMode ? "bg-slate-800 text-blue-400" : "bg-blue-100 text-blue-600")}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                   <h3 className={cn("text-sm font-bold", isDarkMode ? "text-slate-100" : "text-slate-800")}>Tăng trưởng tài sản</h3>
                   <p className="text-[10px] text-slate-400 font-medium">Lịch sử tăng trưởng theo loại hình</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {ASSET_TYPES.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => toggleAssetFilter(asset.id)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border",
                      selectedAssetFilters.includes(asset.id)
                        ? (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100 shadow-sm" : "bg-white border-slate-200 text-slate-900 shadow-sm")
                        : (isDarkMode ? "bg-slate-900 border-transparent text-slate-600 opacity-60" : "bg-slate-50 border-transparent text-slate-400 opacity-60")
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: asset.color }} />
                      {asset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value/1000000}M`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px',
                      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                      color: isDarkMode ? '#f8fafc' : '#0f172a'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                  />
                  {ASSET_TYPES.filter(a => selectedAssetFilters.includes(a.id)).map(asset => (
                    <Line 
                      key={asset.id}
                      type="monotone"
                      dataKey={asset.id} 
                      name={asset.name} 
                      stroke={asset.color} 
                      strokeWidth={2}
                      dot={{ r: 2, strokeWidth: 0, fill: asset.color }}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Status Column */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-6">
          <div className={cn(
            "p-6 rounded-2xl border shadow-sm space-y-8 h-full flex flex-col",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}>
            {/* 1. Net Value Header */}
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80", isDarkMode ? "text-slate-500" : "text-slate-400")}>Giá trị ròng hiện tại</p>
                  <h2 className={cn("text-2xl font-black tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>{formatCurrency(totalCurrentValue)}</h2>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                  profit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {profit >= 0 ? '+' : ''}{((profit / totalInvested) * 100).toFixed(2)}%
                </div>
              </div>
              <div className={cn("flex justify-between items-center border-t border-b py-3", isDarkMode ? "border-slate-800" : "border-slate-50")}>
                 <div>
                    <p className={cn("text-[9px] font-bold uppercase text-slate-400")}>Lợi nhuận</p>
                    <p className={cn("text-xs font-bold", isDarkMode ? "text-emerald-400" : "text-emerald-500")}>{(profit >= 0 ? '+' : '') + formatCurrency(profit)}</p>
                 </div>
                 <div className="text-right">
                    <p className={cn("text-[9px] font-bold uppercase text-slate-400")}>Vốn đã nạp</p>
                    <p className={cn("text-xs font-bold", isDarkMode ? "text-slate-400" : "text-slate-600")}>{formatCurrency(totalInvested)}</p>
                 </div>
              </div>
            </div>

            {/* 2. Portfolio Allocation Chart */}
            <div>
              <h3 className={cn("text-xs font-black uppercase tracking-widest mb-4", isDarkMode ? "text-slate-300" : "text-slate-500")}>Phân bổ danh mục</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={allocationData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2}>
                       {allocationData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ 
                         fontSize: '10px',
                         backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                         border: 'none',
                         borderRadius: '8px'
                       }} 
                     />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 px-2">
                 {allocationData.map((item) => (
                   <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.name}</span>
                     </div>
                     <span className={cn("text-[10px] font-black", isDarkMode ? "text-slate-100" : "text-slate-900")}>{item.value}%</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* 3. Daily Asset Charts (Vertical Stack) */}
            <div className="space-y-4 pt-2">
              <h3 className={cn("text-[10px] font-black uppercase tracking-widest pl-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Hiệu suất 30 ngày qua</h3>
              <div className="space-y-3">
                {dailyData.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center gap-4",
                      isDarkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50/30 border-slate-100"
                    )}
                  >
                    <div className="w-1/3">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{asset.name}</p>
                      <p className={cn("text-xs font-black tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                        {formatCurrency(asset.data[asset.data.length - 1].value)}
                      </p>
                      <div className={cn(
                        "text-[8px] font-black mt-0.5",
                        asset.data[asset.data.length - 1].value >= asset.data[0].value ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {asset.data[asset.data.length - 1].value >= asset.data[0].value ? '↑' : '↓'}
                        {Math.abs(((asset.data[asset.data.length - 1].value / asset.data[0].value - 1) * 100)).toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex-1 h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={asset.data}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={asset.color} 
                            strokeWidth={1.5} 
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Investments;
