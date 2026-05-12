import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Onboarding from './pages/Onboarding';
import { cn } from './utils/helpers';

const AppContent = () => {
  const { initialized, isDarkMode } = useFinance();

  if (!initialized) {
    return <Onboarding />;
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <div className="pt-14">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <Router>
        <AppContent />
      </Router>
    </FinanceProvider>
  );
}
