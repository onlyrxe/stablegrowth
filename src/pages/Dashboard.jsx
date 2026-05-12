import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, ComposedChart, CartesianGrid } from 'recharts';
import { format, subMonths, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, ArrowDownRight, ArrowUpRight, Wallet, PieChart as PieIcon, LineChart as LineIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils/helpers';
import { addMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f97316', '#10b981', '#06b6d4', '#64748b'];

const Dashboard = () => {
  const { transactions, investments, settings, isDarkMode } = useFinance();
  const [monthWindowOffset, setMonthWindowOffset] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));
  const [monthOnly, setMonthOnly] = useState(format(new Date(), 'MM'));
  const [chartTimeframe, setChartTimeframe] = useState(12);

  const timeframes = [
    { label: '3T', value: 3 },
    { label: '6T', value: 6 },
    { label: '1N', value: 12 },
    { label: '2N', value: 24 },
    { label: '5N', value: 60 }
  ];

  const handleMonthSelect = (mStr) => {
    setSelectedMonth(mStr);
    const [year, month] = mStr.split('-');
    setSelectedYear(year);
    setMonthOnly(month);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    const newMonth = `${year}-${monthOnly}`;
    setSelectedMonth(newMonth);
  };

  const handleMonthChange = (month) => {
    setMonthOnly(month);
    const newMonth = `${selectedYear}-${month}`;
    setSelectedMonth(newMonth);
  };

  const navigateMonthWindow = (direction) => {
    setMonthWindowOffset(prev => prev + direction);
  };

  const displayedMonths = useMemo(() => {
    return [5, 4, 3, 2, 1, 0].map(offset => {
      const d = subMonths(new Date(), offset + monthWindowOffset);
      return {
        mStr: format(d, 'yyyy-MM'),
        label: format(d, 'MM/yy')
      };
    });
  }, [monthWindowOffset]);

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const stats = useMemo(() => {
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.investedAmount), 0);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalProfit = totalCurrentValue - totalInvested;

    // Previous month stats
    const lastMonthDate = subMonths(parseISO(selectedMonth + '-01'), 1);
    const lastMonthStr = format(lastMonthDate, 'yyyy-MM');
    const lastMonthTransactions = transactions.filter(t => t.date.startsWith(lastMonthStr));
    const lastIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const lastExpense = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const lastNet = lastIncome - lastExpense;

    const netTrend = lastNet !== 0 ? ((net - lastNet) / Math.abs(lastNet)) * 100 : 0;
    const incomeGrowth = lastIncome !== 0 ? ((income - lastIncome) / lastIncome) * 100 : 0;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    const expenseRate = income > 0 ? (expense / income) * 100 : 0;

    // Safety logic: (Safe Assets / Monthly Expense)
    const latestInv = investments[0];
    const safeAllocation = latestInv ? (latestInv.allocation?.savings || 0) + (latestInv.allocation?.cash || 0) + (latestInv.allocation?.gold || 0) : 0;
    const safeAssetValue = totalCurrentValue * (safeAllocation / 100);
    
    // Average expense of last 3 months for better safety calculation
    const last3Months = [0, 1, 2].map(offset => {
      const d = subMonths(parseISO(selectedMonth + '-01'), offset);
      const mStr = format(d, 'yyyy-MM');
      return transactions.filter(t => t.date.startsWith(mStr) && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    });
    const avgExpense = last3Months.reduce((a, b) => a + b, 0) / (last3Months.filter(v => v > 0).length || 1);
    const safetyMonths = avgExpense > 0 ? safeAssetValue / avgExpense : (expense > 0 ? safeAssetValue / expense : 0);

    return { 
      income, 
      expense, 
      net, 
      totalCurrentValue, 
      totalInvested, 
      totalProfit, 
      netTrend, 
      incomeGrowth, 
      savingsRate, 
      expenseRate,
      safetyMonths,
      hasSufficientData: transactions.length > 0
    };
  }, [monthTransactions, investments, transactions, selectedMonth]);

  const pieData = useMemo(() => {
    const categories = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const weeklyData = useMemo(() => {
    // Group transactions of selected month by week
    const weeks = {
      'Tuần 1': { name: 'Tuần 1', income: 0, expense: 0 },
      'Tuần 2': { name: 'Tuần 2', income: 0, expense: 0 },
      'Tuần 3': { name: 'Tuần 3', income: 0, expense: 0 },
      'Tuần 4': { name: 'Tuần 4', income: 0, expense: 0 },
      'Khác': { name: 'Khác', income: 0, expense: 0 }
    };
    
    monthTransactions.forEach(t => {
      const date = parseISO(t.date);
      const day = date.getDate();
      let weekKey = 'Khác';
      if (day <= 7) weekKey = 'Tuần 1';
      else if (day <= 14) weekKey = 'Tuần 2';
      else if (day <= 21) weekKey = 'Tuần 3';
      else if (day <= 28) weekKey = 'Tuần 4';
      
      if (t.type === 'income') weeks[weekKey].income += t.amount;
      else weeks[weekKey].expense += t.amount;
    });
    
    return Object.values(weeks);
  }, [monthTransactions]);

  const monthlyComparisonData = useMemo(() => {
    // Show months based on chartTimeframe
    return Array.from({ length: chartTimeframe }).map((_, i) => {
      const offset = chartTimeframe - 1 - i;
      const d = subMonths(parseISO(selectedMonth + '-01'), offset);
      const mStr = format(d, 'yyyy-MM');
      const monthTransactions = transactions.filter(t => t.date.startsWith(mStr));
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return { 
        month: format(d, 'MM/yy'), 
        income, 
        expense, 
        net: income - expense 
      };
    });
  }, [selectedMonth, transactions, chartTimeframe]);

  const growthData = useMemo(() => {
    return [...investments].reverse().map(inv => ({
      date: format(parseISO(inv.date), 'MM/yy'),
      value: inv.currentValue
    }));
  }, [investments]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={cn("text-xl font-bold tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>Tổng quan tài chính</h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Tháng {format(parseISO(selectedMonth + '-01'), 'MM, yyyy')}</p>
        </div>
        <div className={cn(
          "flex flex-wrap items-center justify-between sm:justify-start gap-1.5 p-1.5 rounded-xl shadow-sm overflow-x-auto scrollbar-hide border w-full sm:w-auto",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}>
          <div className={cn("hidden sm:flex items-center gap-1 pr-1.5 border-r mr-1", isDarkMode ? "border-slate-800" : "border-slate-100")}>
            <button 
              onClick={() => navigateMonthWindow(1)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isDarkMode ? "hover:bg-slate-800 text-slate-500 hover:text-emerald-400" : "hover:bg-slate-50 text-slate-400 hover:text-emerald-500"
              )}
              title="Cũ hơn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {displayedMonths.map(({ mStr, label }) => (
                <button
                  key={mStr}
                  onClick={() => handleMonthSelect(mStr)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border whitespace-nowrap uppercase tracking-tighter",
                    selectedMonth === mStr 
                      ? (isDarkMode ? "bg-emerald-500 border-emerald-500 text-slate-950" : "bg-slate-900 border-slate-900 text-white")
                      : (isDarkMode ? "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800" : "bg-white border-slate-50 text-slate-400 hover:bg-slate-50")
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigateMonthWindow(-1)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isDarkMode ? "hover:bg-slate-800 text-slate-500 hover:text-emerald-400" : "hover:bg-slate-50 text-slate-400 hover:text-emerald-500"
              )}
              title="Mới hơn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex items-center group w-full sm:w-auto gap-2">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className={cn(
                  "text-[10px] font-black cursor-pointer py-2 pl-3 pr-8 w-full sm:w-24 uppercase tracking-tighter transition-all border rounded-lg appearance-none",
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800 focus:ring-emerald-500" 
                    : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 focus:ring-emerald-500 shadow-sm"
                )}
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year.toString()}>Năm {year}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 sm:flex-none">
              <select 
                value={monthOnly}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={cn(
                  "text-[10px] font-black cursor-pointer py-2 pl-3 pr-8 w-full sm:w-32 uppercase tracking-tighter transition-all border rounded-lg appearance-none",
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-800 focus:ring-emerald-500" 
                    : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 focus:ring-emerald-500 shadow-sm"
                )}
              >
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                  <option key={m} value={m}>Tháng {parseInt(m)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tiền ròng" 
          amount={stats.net} 
          trend={stats.netTrend !== 0 ? `${stats.netTrend > 0 ? '↑' : '↓'} ${Math.abs(stats.netTrend).toFixed(1)}% so với tháng trước` : undefined}
          color="emerald"
          isDarkMode={isDarkMode}
        />
        <StatCard 
          title="Tổng thu" 
          amount={stats.income} 
          progress={stats.income > 0 ? 100 : 0}
          color="slate"
          isDarkMode={isDarkMode}
        />
        <StatCard 
          title="Tổng chi" 
          amount={stats.expense} 
          progress={stats.income > 0 ? Math.min(100, stats.expenseRate) : 0}
          color="rose"
          isDarkMode={isDarkMode}
        />
        <StatCard 
          title="Đầu tư" 
          amount={stats.totalCurrentValue} 
          trend={stats.totalProfit !== 0 ? `${stats.totalProfit > 0 ? '+' : ''}${formatCurrency(stats.totalProfit)} lợi nhuận` : undefined}
          color="gradient"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "lg:col-span-4 p-5 rounded-2xl shadow-sm border flex flex-col h-[300px]",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={cn("font-bold text-sm", isDarkMode ? "text-slate-100" : "text-slate-800")}>Cơ cấu chi tiêu</h3>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest",
              isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
            )}>Tháng này</span>
          </div>
          <div className="flex-1 min-h-0">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={isDarkMode ? { backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '10px' } : { borderRadius: '8px', border: 'none', fontSize: '10px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px', textTransform: 'uppercase' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">Không có dữ liệu chi tiêu</div>
            )}
          </div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "lg:col-span-8 p-5 rounded-2xl shadow-sm border h-[300px] flex flex-col",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={cn("font-bold text-sm", isDarkMode ? "text-slate-100" : "text-slate-800")}>Thu chi theo tuần</h3>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Tháng {format(parseISO(selectedMonth + '-01'), 'MM/yyyy')}</div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} hide />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', backgroundColor: isDarkMode ? '#1e293b' : '#fff' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} />
                <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart Comparison */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "lg:col-span-12 p-5 rounded-2xl shadow-sm border h-[350px] flex flex-col",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}
        >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h3 className={cn("font-bold text-sm", isDarkMode ? "text-slate-100" : "text-slate-800")}>Hiệu suất tài chính</h3>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border dark:border-slate-700">
                  {timeframes.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => setChartTimeframe(tf.value)}
                      className={cn(
                        "px-2 py-1 rounded text-[9px] font-black transition-all",
                        chartTimeframe === tf.value
                          ? (isDarkMode ? "bg-emerald-500 text-slate-900 shadow-sm" : "bg-slate-900 text-white shadow-sm")
                          : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900")
                      )}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} hide />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} barSize={15} />
                <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={15} />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  name="Tiền ròng" 
                  stroke={isDarkMode ? "#38bdf8" : "#3b82f6"} 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: isDarkMode ? "#38bdf8" : "#3b82f6", strokeWidth: 0 }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "lg:col-span-7 p-5 rounded-2xl shadow-sm border flex flex-col h-[300px]",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={cn("font-bold text-sm", isDarkMode ? "text-slate-100" : "text-slate-800")}>Tăng trưởng tài sản</h3>
            {investments.length >= 12 && (
              <div className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">
                +{formatCurrency((growthData[growthData.length - 1]?.value - growthData[0]?.value) || 0)} / Năm
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px',
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Investment Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "lg:col-span-5 p-5 rounded-2xl shadow-sm border flex flex-col",
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          )}
        >
          <h3 className={cn("font-bold text-sm mb-4", isDarkMode ? "text-slate-100" : "text-slate-800")}>Trình quản lý rủi ro</h3>
          <div className="space-y-4">
            <div className={cn("p-3 rounded-xl border", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100")}>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vốn gốc hiện tại</p>
               <p className={cn("text-lg font-bold", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                 {formatCurrency(investments.reduce((sum, inv) => sum + inv.investedAmount, 0))}
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {stats.totalProfit !== 0 && (
                <div className={cn("p-3 rounded-xl border text-center", isDarkMode ? "bg-emerald-950 border-emerald-900" : "bg-emerald-50 border-emerald-100")}>
                  <p className={cn("text-[10px] font-bold uppercase mb-1", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>Lợi nhuận gộp</p>
                  <p className={cn("text-sm font-black", isDarkMode ? "text-emerald-300" : "text-emerald-900")}>
                    {formatCurrency(stats.totalProfit)}
                  </p>
                </div>
              )}
              {stats.safetyMonths > 0 && (
                <div className={cn("p-3 rounded-xl border text-center", isDarkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100")}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dự phòng</p>
                  <p className={cn("text-sm font-black", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                    {stats.safetyMonths.toFixed(1)} tháng CT
                  </p>
                </div>
              )}
            </div>

            <div className={cn("pt-4 border-t", isDarkMode ? "border-slate-800" : "border-slate-50")}>
               <button className={cn(
                 "w-full py-2.5 text-xs font-bold rounded-lg transition-colors",
                 isDarkMode ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-slate-900 text-white hover:bg-slate-800"
               )}>Tối ưu hóa tài sản</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, trend, progress, color, isDarkMode }) => {
  const styles = {
    emerald: { 
      bg: isDarkMode ? 'bg-slate-900' : 'bg-white', 
      text: isDarkMode ? 'text-emerald-400' : 'text-emerald-600', 
      border: isDarkMode ? 'border-slate-800' : 'border-slate-100' 
    },
    rose: { 
      bg: isDarkMode ? 'bg-slate-900' : 'bg-white', 
      text: isDarkMode ? 'text-rose-400' : 'text-rose-500', 
      border: isDarkMode ? 'border-slate-800' : 'border-slate-100' 
    },
    slate: { 
      bg: isDarkMode ? 'bg-slate-900' : 'bg-white', 
      text: isDarkMode ? 'text-slate-100' : 'text-slate-900', 
      border: isDarkMode ? 'border-slate-800' : 'border-slate-100' 
    },
    gradient: { 
      bg: 'bg-emerald-600', 
      text: 'text-white', 
      border: 'border-emerald-700' 
    }
  };

  const current = styles[color];

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={cn("p-4 rounded-2xl shadow-sm border flex flex-col justify-between", current.bg, current.border)}
    >
      <div>
        <div className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", color === 'gradient' ? 'opacity-80' : 'text-slate-500')}>
          {title}
        </div>
        <div className={cn("text-xl font-bold tracking-tight", current.text)}>
          {formatCurrency(amount)}
        </div>
      </div>
      
      {trend && (
        <div className={cn("text-[10px] mt-2 font-medium", color === 'gradient' ? 'opacity-90' : (amount >= 0 ? 'text-emerald-500' : 'text-rose-500'))}>
          {trend}
        </div>
      )}

      {progress !== undefined && (
        <div className={cn("w-full h-1 mt-3 rounded-full overflow-hidden", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
          <div className={cn("h-full rounded-full", color === 'rose' ? 'bg-rose-400' : 'bg-emerald-500')} style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
