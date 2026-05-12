import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Rocket, Database } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const Onboarding = () => {
  const { initApp } = useFinance();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="text-green-600 w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">StableGrowth</h1>
        <p className="text-gray-500 mb-8">
          Quản lý tài chính và tự động hóa lộ trình đầu tư theo phong cách hiện đại.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => initApp('demo')}
            className="w-full group flex items-center justify-between p-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="flex items-center">
              <Database className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-bold">Trải nghiệm demo</div>
                <div className="text-green-100 text-xs">Sử dụng dữ liệu mẫu 6 tháng</div>
              </div>
            </div>
            <Rocket className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button
            onClick={() => initApp('empty')}
            className="w-full flex items-center justify-center p-4 border-2 border-gray-100 hover:border-green-200 hover:bg-green-50 text-gray-600 rounded-2xl transition-all duration-300"
          >
            Bắt đầu trống
          </button>
        </div>
        
        <p className="mt-8 text-xs text-gray-400">
          Dữ liệu được lưu trữ an toàn trong trình duyệt của bạn (localStorage).
        </p>
      </motion.div>
    </div>
  );
};

export default Onboarding;
