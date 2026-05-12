import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Search, Download, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, cn } from '../utils/helpers';
import { format, subMonths, addMonths, parseISO } from 'date-fns';

const Transactions = () => {
  const { transactions, addTransaction, deleteTransaction, categories } = useFinance();
  
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
  const [monthWindowOffset, setMonthWindowOffset] = useState(0);

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quản lý giao dịch</h1>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Cập nhật nhanh thu chi hàng ngày của bạn.</p>
        </div>
      </div>

      {/* Quick Add Form - Dense */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
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
                className="w-full pl-7 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold text-base" 
                required 
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại hình</label>
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              <button type="button" onClick={() => setType('expense')} className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-md transition-all", type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500")}>Chi</button>
              <button type="button" onClick={() => setType('income')} className={cn("flex-1 py-1.5 px-2 text-[10px] font-bold rounded-md transition-all", type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500")}>Thu</button>
            </div>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Danh mục</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs font-bold appearance-none">
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
              className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs font-bold"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Ghi chú</label>
            <input type="text" placeholder="..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-emerald-500 text-xs" />
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all shadow-md shadow-emerald-100 text-xs">Lưu</button>
          </div>
        </form>
      </motion.div>

      {/* Stats - Compact */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiền ròng</p>
          <p className={cn("text-lg font-black", stats.net >= 0 ? "text-emerald-600" : "text-rose-500")}>{formatCurrency(stats.net)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng thu</p>
          <p className="text-lg font-black text-slate-900">{formatCurrency(stats.income)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng chi</p>
          <p className="text-lg font-black text-rose-500">{formatCurrency(stats.expense)}</p>
        </div>
      </div>

      {/* Table - High Density */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/30">
          <button onClick={exportCSV} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-colors shadow-sm uppercase tracking-wider">
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input type="text" placeholder="Tìm..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs" />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <button 
              onClick={() => navigateMonthWindow(1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-emerald-500 transition-all border border-transparent hover:border-slate-100"
              title="Cũ hơn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {displayedMonths.map(({ mStr, label }) => (
                <button
                  key={mStr}
                  onClick={() => setFilterMonth(mStr)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all border whitespace-nowrap",
                    filterMonth === mStr 
                      ? "bg-slate-900 border-slate-900 text-white" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigateMonthWindow(-1)}
              className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-emerald-500 transition-all border border-transparent hover:border-slate-100"
              title="Mới hơn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <input 
              type="month" 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)} 
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none w-24 font-bold" 
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-bold">
              <option value="all">Tất cả hạng mục</option>
              {Array.from(new Set([...categories.expense, ...categories.income])).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-5 py-3 ml-2">Ngày</th>
                <th className="px-5 py-3">Ghi chú</th>
                <th className="px-5 py-3">Danh mục</th>
                <th className="px-5 py-3 text-right">Số tiền</th>
                <th className="px-5 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredTransactions.map((t) => (
                  <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs font-semibold text-slate-400 tracking-tight">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{t.note}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-bold",
                        t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {t.category}
                      </span>
                    </td>
                    <td className={cn("px-5 py-3 text-sm font-bold text-right", t.type === 'income' ? "text-emerald-600" : "text-rose-500")}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredTransactions.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-300 text-sm italic">Không tìm thấy giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
