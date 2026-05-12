import { subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay } from 'date-fns';
import { seededRandom, defaultCategories } from './helpers';

export const generateDemoData = () => {
  const transactions = [];
  const investments = [];
  const now = new Date('2026-12-31');
  
  // Generate 12 months of transactions
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = startOfMonth(monthDate);
    const end = i === 0 ? now : endOfMonth(monthDate);
    
    // Fixed monthly income
    transactions.push({
      id: `income-${i}`,
      amount: 25000000 + (Math.floor(seededRandom(i) * 5000000)),
      type: 'income',
      category: 'Lương',
      note: 'Lương tháng ' + format(monthDate, 'MM/yyyy'),
      date: format(start, 'yyyy-MM-dd'),
    });

    // Freelance income
    if (seededRandom(i + 10) > 0.5) {
      transactions.push({
        id: `freelance-${i}`,
        amount: 5000000 + (Math.floor(seededRandom(i + 11) * 3000000)),
        type: 'income',
        category: 'Freelance',
        note: 'Dự án ngoài',
        date: format(addDays(start, 15), 'yyyy-MM-dd'),
      });
    }

    // Daily/Weekly expenses
    const days = eachDayOfInterval({ start, end });
    days.forEach((day, dayIdx) => {
      // Small daily expenses (food, transport)
      transactions.push({
        id: `exp-daily-${i}-${dayIdx}`,
        amount: 50000 + (Math.floor(seededRandom(dayIdx + (i * 30)) * 150000)),
        type: 'expense',
        category: seededRandom(dayIdx) > 0.7 ? 'Di chuyển' : 'Ăn uống',
        note: 'Tiền ăn/đi lại hàng ngày',
        date: format(day, 'yyyy-MM-dd'),
      });

      // Weekly shopping or bills
      if (dayIdx % 7 === 0) {
        transactions.push({
          id: `exp-weekly-${i}-${dayIdx}`,
          amount: 500000 + (Math.floor(seededRandom(dayIdx * 2) * 1500000)),
          type: 'expense',
          category: 'Mua sắm',
          note: 'Mua sắm cuối tuần',
          date: format(day, 'yyyy-MM-dd'),
        });
      }

      // Monthly bills
      if (dayIdx === 5) {
        transactions.push({
          id: `exp-bill-${i}`,
          amount: 1200000 + (Math.floor(seededRandom(i * 5) * 800000)),
          type: 'expense',
          category: 'Hóa đơn',
          note: 'Điện nước internet',
          date: format(day, 'yyyy-MM-dd'),
        });
      }
    });

    // Investment simulation for history
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && format(new Date(t.date), 'MM/yyyy') === format(monthDate, 'MM/yyyy'))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = transactions
      .filter(t => t.type === 'expense' && format(new Date(t.date), 'MM/yyyy') === format(monthDate, 'MM/yyyy'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netMoney = monthlyIncome - monthlyExpense;
    if (netMoney > 0 && i > 0) {
      investments.unshift({
        id: `inv-${i}`,
        date: format(addDays(start, 24), 'yyyy-MM-dd'),
        investedAmount: Math.floor(netMoney * 0.8),
        allocation: {
          stocks: 50,
          savings: 10,
          cash: 10,
          gold: 10,
          usd: 20
        },
        currentValue: Math.floor(netMoney * 0.8 * (1 + (seededRandom(i) * 0.2 - 0.05))),
      });
    }
  }

  return { transactions, investments };
};
