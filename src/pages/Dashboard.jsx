import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { format, subMonths, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, ArrowDownRight, ArrowUpRight, Wallet, PieChart as PieIcon, LineChart as LineIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils/helpers';
import { addMonths } from 'date-fns';

const COLORS = ['#10b981', '#34d399', '#94a3b8', '#cbd5e1', '#8b5cf6', '#ec4899', '#64748b'];

const Dashboard = () => {
  const { transactions, investments, settings } = useFinance();
  const [monthWindowOffset, setMonthWindowOffset] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

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
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  const monthlyComparisonData = useMemo(() => {
    const current = { month: 'Tháng này', income: stats.income, expense: stats.expense };
    const lastMonthDate = subMonths(parseISO(selectedMonth + '-01'), 1);
    const lastMonthStr = format(lastMonthDate, 'yyyy-MM');
    const lastMonthTransactions = transactions.filter(t => t.date.startsWith(lastMonthStr));
    const lastIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const lastExpense = lastMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return [{ month: 'T-1', income: lastIncome, expense: lastExpense }, current];
  }, [selectedMonth, transactions, stats]);

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tổng quan tài chính</h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Tháng {format(parseISO(selectedMonth + '-01'), 'MM, yyyy')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 pr-1.5 border-r border-slate-100 mr-1">
            <button 
              onClick={() => navigateMonthWindow(1)}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"
              title="Cũ hơn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {displayedMonths.map(({ mStr, label }) => (
                <button
                  key={mStr}
                  onClick={() => setSelectedMonth(mStr)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border whitespace-nowrap uppercase tracking-tighter",
                    selectedMonth === mStr 
                      ? "bg-slate-900 border-slate-900 text-white" 
                      : "bg-white border-slate-50 text-slate-400 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigateMonthWindow(-1)}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"
              title="Mới hơn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex items-center group">
            <input 
              type="month" 
              value={selectedMonth}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonth(e.target.value);
                }
              }}
              className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 cursor-pointer py-1.5 pl-3 pr-8 w-32 uppercase tracking-tighter hover:bg-slate-100 transition-colors"
            />
            <div className="absolute right-2 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors">
              <ChevronDown className="w-3 h-3" />
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
        />
        <StatCard 
          title="Tổng thu" 
          amount={stats.income} 
          progress={stats.income > 0 ? 100 : 0}
          color="slate"
        />
        <StatCard 
          title="Tổng chi" 
          amount={stats.expense} 
          progress={stats.income > 0 ? Math.min(100, stats.expenseRate) : 0}
          color="rose"
        />
        <StatCard 
          title="Đầu tư" 
          amount={stats.totalCurrentValue} 
          trend={stats.totalProfit !== 0 ? `${stats.totalProfit > 0 ? '+' : ''}${formatCurrency(stats.totalProfit)} lợi nhuận` : undefined}
          color="gradient"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[300px]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Cơ cấu chi tiêu</h3>
            <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-widest">Tháng này</span>
          </div>
          <div className="flex-1 min-h-0">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">Không có dữ liệu chi tiêu</div>
            )}
          </div>
        </motion.div>

        {/* Bar Chart Comparison */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-[300px] flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Hiệu suất tài chính</h3>
            {stats.savingsRate > 0 && (
              <div className="text-[10px] text-emerald-600 font-black tracking-tight uppercase">
                {stats.savingsRate.toFixed(1)}% Tỷ lệ tiết kiệm
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="income" name="Thu" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="expense" name="Chi" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
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
          className="lg:col-span-7 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[300px]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Tăng trưởng tài sản</h3>
            {investments.length >= 12 && (
              <div className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">
                +{formatCurrency((growthData[growthData.length - 1]?.value - growthData[0]?.value) || 0)} / Năm
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
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
          className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col"
        >
          <h3 className="font-bold text-slate-800 text-sm mb-4">Trình quản lý rủi ro</h3>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vốn gốc hiện tại</p>
               <p className="text-lg font-bold text-slate-900">{formatCurrency(investments.reduce((sum, inv) => sum + inv.investedAmount, 0))}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {stats.totalProfit !== 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Lợi nhuận gộp</p>
                  <p className="text-sm font-black text-emerald-900">
                    {formatCurrency(stats.totalProfit)}
                  </p>
                </div>
              )}
              {stats.safetyMonths > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dự phòng</p>
                  <p className="text-sm font-black text-slate-900">
                    {stats.safetyMonths.toFixed(1)} tháng CT
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50">
               <button className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">Tối ưu hóa tài sản</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, trend, progress, color }) => {
  const styles = {
    emerald: { bg: 'bg-white', text: 'text-emerald-600', border: 'border-slate-100' },
    rose: { bg: 'bg-white', text: 'text-rose-500', border: 'border-slate-100' },
    slate: { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-100' },
    gradient: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' }
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

      {progress && (
        <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", color === 'rose' ? 'bg-rose-400' : 'bg-emerald-500')} style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
