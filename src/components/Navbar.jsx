import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, TrendingUp, RefreshCw } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useFinance } from '../context/FinanceContext';

const Navbar = () => {
  const { resetApp } = useFinance();
  const navItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Thu chi', path: '/transactions', icon: ReceiptText },
    { name: 'Đầu tư tự động', path: '/investments', icon: TrendingUp },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center space-x-2 mr-8">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">StableGrowth</span>
          </div>
          
          <div className="flex h-full">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center px-4 text-[13px] font-semibold transition-all duration-200 h-full border-b-2",
                  isActive 
                    ? "border-emerald-500 text-emerald-600" 
                    : "border-transparent text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                )}
              >
                {item.name}
              </NavLink>
            ))}
          </div>
          
          <div className="ml-auto flex items-center gap-4">
             <button 
               onClick={() => {
                 if(window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và bắt đầu lại?')) {
                   resetApp();
                 }
               }}
               className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
               title="Bắt đầu lại"
             >
               <RefreshCw className="w-4 h-4" />
             </button>
             <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
