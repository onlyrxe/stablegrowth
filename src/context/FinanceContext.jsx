import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, loadData, saveData, defaultCategories } from '../utils/helpers';
import { generateDemoData } from '../utils/demoData';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [investments, setInvestments] = useState([]);
  const [settings, setSettings] = useState({
    investmentDay: 25,
    allocation: {
      stocks: 50,
      savings: 12.5,
      cash: 12.5,
      gold: 12.5,
      usd: 12.5
    },
    selectedStocks: ['FPT', 'HPG', 'VCB', 'TCB', 'MWG']
  });
  const [initialized, setInitialized] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const savedTransactions = loadData(STORAGE_KEYS.TRANSACTIONS, null);
    const savedCategories = loadData(STORAGE_KEYS.CATEGORIES, defaultCategories);
    const savedInvestments = loadData(STORAGE_KEYS.INVESTMENTS, []);
    const savedSettings = loadData(STORAGE_KEYS.SETTINGS, settings);
    const demoMode = loadData(STORAGE_KEYS.DEMO_MODE, false);

    if (savedTransactions !== null) {
      setTransactions(savedTransactions);
      setCategories(savedCategories);
      setInvestments(savedInvestments);
      setSettings(savedSettings);
      setIsDemo(demoMode);
      setInitialized(true);
    }
  }, []);

  const initApp = (mode) => {
    if (mode === 'demo') {
      const demoData = generateDemoData();
      setTransactions(demoData.transactions);
      setInvestments(demoData.investments);
      setIsDemo(true);
      saveData(STORAGE_KEYS.DEMO_MODE, true);
      saveData(STORAGE_KEYS.TRANSACTIONS, demoData.transactions);
      saveData(STORAGE_KEYS.INVESTMENTS, demoData.investments);
    } else {
      setTransactions([]);
      setInvestments([]);
      setIsDemo(false);
      saveData(STORAGE_KEYS.DEMO_MODE, false);
      saveData(STORAGE_KEYS.TRANSACTIONS, []);
      saveData(STORAGE_KEYS.INVESTMENTS, []);
    }
    setInitialized(true);
  };

  const resetApp = () => {
    console.log('Resetting application state...');
    // Completely wipe all local storage
    localStorage.clear();
    
    // Reset all React state to initial values immediately
    setTransactions([]);
    setInvestments([]);
    setCategories(defaultCategories);
    setIsDemo(false);
    setInitialized(false);

    // Explicitly set default settings for the next load
    const defaultSettings = {
      investmentDay: 25,
      allocation: {
        stocks: 50,
        savings: 12.5,
        cash: 12.5,
        gold: 12.5,
        usd: 12.5
      },
      selectedStocks: ['FPT', 'HPG', 'VCB', 'TCB', 'MWG']
    };
    setSettings(defaultSettings);
    saveData(STORAGE_KEYS.SETTINGS, defaultSettings);
    
    // Force direct navigation to root and reload
    window.location.href = '/';
    setTimeout(() => window.location.reload(), 100);
  };

  const addTransaction = (transaction) => {
    const newTransactions = [transaction, ...transactions];
    setTransactions(newTransactions);
    saveData(STORAGE_KEYS.TRANSACTIONS, newTransactions);
  };

  const deleteTransaction = (id) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    setTransactions(newTransactions);
    saveData(STORAGE_KEYS.TRANSACTIONS, newTransactions);
  };

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveData(STORAGE_KEYS.SETTINGS, updated);
  };

  const addInvestment = (investment) => {
    const newInv = [investment, ...investments];
    setInvestments(newInv);
    saveData(STORAGE_KEYS.INVESTMENTS, newInv);
  };

  const addCategory = (type, category) => {
    if (categories[type].includes(category)) return;
    const updatedCategories = {
      ...categories,
      [type]: [...categories[type], category]
    };
    setCategories(updatedCategories);
    saveData(STORAGE_KEYS.CATEGORIES, updatedCategories);
  };

  const removeCategory = (type, category) => {
    if (defaultCategories[type].includes(category)) return;
    const updatedCategories = {
      ...categories,
      [type]: categories[type].filter(c => c !== category)
    };
    setCategories(updatedCategories);
    saveData(STORAGE_KEYS.CATEGORIES, updatedCategories);
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      categories,
      investments,
      settings,
      initialized,
      isDemo,
      initApp,
      resetApp,
      addTransaction,
      deleteTransaction,
      addCategory,
      removeCategory,
      updateSettings,
      addInvestment,
      setTransactions,
      setInvestments
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
