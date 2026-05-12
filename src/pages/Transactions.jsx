import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Search, Download, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils/helpers';
import { format, subMonths, addMonths, parseISO } from 'date-fns';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction, categories, isDarkMode } = useFinance();
  
  // Form State
  const [displayAmount, setDisplayAmount] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterYear, setFilterYear] = useState(format(new Date(), 'yyyy'));
  const [filterMonthOnly, setFilterMonthOnly] = useState(format(new Date(), 'MM'));
  const [monthWindowOffset, setMonthWindowOffset] = useState(0);

  const handleMonthSelect = (mStr) => {
    setFilterMonth(mStr);
    const [year, month] = mStr.split('-');
    setFilterYear(year);
    setFilterMonthOnly(month);
  };

  const handleYearChange = (year) => {
    setFilterYear(year);
    const newMonth = `${year}-${filterMonthOnly}`;
    setFilterMonth(newMonth);
  };

  const handleMonthChange = (month) => {
    setFilterMonthOnly(month);
    const newMonth = `${filterYear}-${month}`;
    setFilterMonth(newMonth);
  };

  const navigateMonthWindow = (direction) => {
    setMonthWindowOffset(prev => prev + direction);
  };

  const displayedMonths = useMemo(() => {
    return [2, 1, 0].map(offset => {
      const d = subMonths(new Date(), offset + monthWindowOffset);
      return {
        mStr: format(d, 'yyyy-MM'),
        label: format(d, 'MM/yy')
      };
    });
  }, [monthWindowOffset]);

  // Utility to format input with dots
  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      setDisplayAmount('');
      setAmount(0);
      return;
    }
    const numericVal = parseInt(val);
    setAmount(numericVal);
    setDisplayAmount(new Intl.NumberFormat('vi-VN').format(numericVal));
  };

  // Derived Stats
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = (t.note || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchMonth = t.date.startsWith(filterMonth);
      return matchSearch && matchCategory && matchMonth;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, filterCategory, filterMonth]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!amount || !type) return;

    const newTransaction = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      type,
      category: category || 'Khác',
      note,
      date
    };

    addTransaction(newTransaction);
    setAmount(0);
    setDisplayAmount('');
    setNote('');
    setCategory('');
  };

  const exportCSV = () => {
    const headers = ['Ngày', 'Loại', 'Danh mục', 'Ghi chú', 'Số tiền'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type === 'income' ? 'Thu' : 'Chi',
      t.category,
      t.note,
      t.amount
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vc_finance_${filterMonth}.csv`);
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-hidden">
      <div className="flex justify-between items-end">
        <div>
          <h1 className={cn("text-xl font-bold tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>Quản lý giao dịch</h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Cập nhật nhanh thu chi hàng ngày của bạn.</p>
        </div>
      </div>

      {/* Quick Add Form - Dense */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className={cn(
          "p-5 rounded-2xl shadow-sm border",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        )}
      >
        <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số tiền (đã định dạng)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₫</span>
              <input 
                type="text" 
                placeholder="0" 
                value={displayAmount} 
                onChange={handleAmountChange} 
                className={cn(
                  "w-full pl-7 pr-4 py-2 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold text-base",
                  isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-900"
                )} 
                required 
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại hình</label>
            <div className={cn("flex p-0.5 rounded-lg", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
              <button type="button" onClick={() => setType('expense')} className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-md transition-all", type === 'expense' ? (isDarkMode ? "bg-slate-700 text-rose-400 shadow-sm" : "bg-white text-rose-600 shadow-sm") : "text-slate-500")}>Chi</button>
              <button type="button" onClick={() => setType('income')} className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-md transition-all", type === 'income' ? (isDarkMode ? "bg-slate-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm") : "text-slate-500")}>Thu</button>
            </div>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Danh mục</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className={cn(
                "w-full px-3 py-2 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs font-bold appearance-none",
                isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-900"
              )}
            >
              <option value="">Chọn...</option>
              {categories[type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ngày</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className={cn(
                "w-full px-3 py-2 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs font-bold",
                isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-900"
              )}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú</label>
            <input 
              type="text" 
              placeholder="..." 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              className={cn(
                "w-full px-3 py-2 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs",
                isDarkMode ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-900"
              )} 
            />
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-emerald-900/10 text-xs">Lưu</button>
          </div>
        </form>
      </motion.div>

      {/* Stats - Compact */}
      <div className="grid grid-cols-3 gap-4">
        <div className={cn("p-4 rounded-2xl border shadow-sm", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiền ròng</p>
          <p className={cn("text-lg font-black", stats.net >= 0 ? "text-emerald-500" : "text-rose-500")}>{formatCurrency(stats.net)}</p>
        </div>
        <div className={cn("p-4 rounded-2xl border shadow-sm", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng thu</p>
          <p className={cn("text-lg font-black", isDarkMode ? "text-slate-100" : "text-slate-900")}>{formatCurrency(stats.income)}</p>
        </div>
        <div className={cn("p-4 rounded-2xl border shadow-sm", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng chi</p>
          <p className="text-lg font-black text-rose-500">{formatCurrency(stats.expense)}</p>
        </div>
      </div>

      {/* Table - High Density */}
      <div className={cn("rounded-2xl border shadow-sm overflow-hidden", isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
        <div className={cn(
          "px-5 py-4 border-b flex flex-col sm:flex-row gap-3 items-center justify-between",
          isDarkMode ? "bg-slate-800/50 border-slate-800" : "bg-slate-50/30 border-slate-50"
        )}>
          <button onClick={exportCSV} className={cn(
            "flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors shadow-sm uppercase tracking-wider",
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}>
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input 
              type="text" 
              placeholder="Tìm..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className={cn(
                "w-full pl-9 pr-4 py-1.5 border rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs",
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )} 
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <button 
              onClick={() => navigateMonthWindow(1)}
              className={cn(
                "p-1.5 rounded-lg transition-all border border-transparent",
                isDarkMode ? "hover:bg-slate-800 text-slate-500 hover:text-emerald-400" : "hover:bg-white text-slate-400 hover:text-emerald-500 hover:border-slate-100"
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
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all border whitespace-nowrap",
                    filterMonth === mStr 
                      ? (isDarkMode ? "bg-emerald-500 border-emerald-500 text-slate-950" : "bg-slate-900 border-slate-900 text-white")
                      : (isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigateMonthWindow(-1)}
              className={cn(
                "p-1.5 rounded-lg transition-all border border-transparent",
                isDarkMode ? "hover:bg-slate-800 text-slate-500 hover:text-emerald-400" : "hover:bg-white text-slate-400 hover:text-emerald-500 hover:border-slate-100"
              )}
              title="Mới hơn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <select 
                   value={filterYear}
                   onChange={(e) => handleYearChange(e.target.value)}
                   className={cn(
                     "px-2 py-1.5 border rounded-lg text-[10px] outline-none font-black appearance-none pr-7 uppercase tracking-tighter",
                     isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-sm"
                   )} 
                 >
                   {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>Năm {y}</option>)}
                 </select>
                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
               </div>
               <div className="relative">
                 <select 
                   value={filterMonthOnly}
                   onChange={(e) => handleMonthChange(e.target.value)}
                   className={cn(
                     "px-2 py-1.5 border rounded-lg text-[10px] outline-none font-black appearance-none pr-7 uppercase tracking-tighter w-24",
                     isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-sm"
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
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)} 
              className={cn(
                "px-2 py-1.5 border rounded-lg text-xs outline-none font-bold",
                isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <option value="all">Tất cả hạng mục</option>
              {Array.from(new Set([...categories.expense, ...categories.income])).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={cn("text-[10px] font-black uppercase tracking-widest", isDarkMode ? "bg-slate-800/50 text-slate-500" : "bg-slate-50 text-slate-500")}>
              <tr>
                <th className="px-5 py-3">Ngày</th>
                <th className="px-5 py-3">Ghi chú</th>
                <th className="px-5 py-3">Danh mục</th>
                <th className="px-5 py-3 text-right">Số tiền</th>
                <th className="px-5 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDarkMode ? "divide-slate-800" : "divide-slate-50")}>
              <AnimatePresence>
                {filteredTransactions.map((t) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("transition-colors", isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50")}>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500 tracking-tight">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                    <td className={cn("px-5 py-3 text-sm font-medium", isDarkMode ? "text-slate-200" : "text-slate-900")}>{t.note}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-bold",
                        t.type === 'income' 
                          ? (isDarkMode ? "bg-emerald-950 text-emerald-400" : "bg-emerald-50 text-emerald-600") 
                          : (isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600")
                      )}>
                        {t.category}
                      </span>
                    </td>
                    <td className={cn("px-5 py-3 text-sm font-bold text-right", t.type === 'income' ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : "text-rose-500")}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredTransactions.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm italic">Không tìm thấy giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
