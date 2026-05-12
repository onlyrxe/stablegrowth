import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Onboarding from './pages/Onboarding';

const AppContent = () => {
  const { initialized } = useFinance();

  if (!initialized) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-14 text-slate-900">
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
