import { useMemo } from 'react'

// Filter out system/correction transactions and trade transactions from all charts
// Trade transactions are excluded because they may have raw foreign currency amounts;
// trade P/L is handled separately via tradePLConverted in the dashboard
const isValidTransaction = (txn) => {
  if (txn.type === 'transfer') return false
  if (txn.description?.includes('Balance Correction')) return false
  if (txn.description?.includes('⚖️')) return false
  if (txn.categories?.name === 'Trade') return false
  return true
}

/**
 * Custom hook to process financial transactions for monthly analytics
 * @param {Array} transactions - All transactions array
 * @param {number} selectedMonth - 0-based month index (0=Jan, 11=Dec)
 * @param {number} selectedYear - Full year (e.g. 2026)
 */
export function useMonthlyAnalytics(transactions, selectedMonth, selectedYear) {
  // Filter valid transactions (exclude transfer, balance correction, etc.)
  const validTransactions = useMemo(() => {
    return (transactions || []).filter(isValidTransaction)
  }, [transactions])

  // Filter transactions for the selected month
  const monthlyTransactions = useMemo(() => {
    return validTransactions.filter(txn => {
      const txnDate = new Date(txn.date)
      return txnDate.getMonth() === selectedMonth && txnDate.getFullYear() === selectedYear
    })
  }, [validTransactions, selectedMonth, selectedYear])

  // KPI Cards - summary stats for selected month
  const kpiData = useMemo(() => {
    const income = monthlyTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

    const expense = monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

    const balance = income - expense
    const savingsRate = income > 0 ? (balance / income) * 100 : 0
    const transactionCount = monthlyTransactions.length

    // Find the largest expense category
    const categoryMap = {}
    monthlyTransactions
      .filter(txn => txn.type === 'expense' && txn.categories)
      .forEach(txn => {
        const catName = txn.categories?.name || 'Khác'
        const catIcon = txn.categories?.icon || '📁'
        if (!categoryMap[catName]) categoryMap[catName] = { name: catName, icon: catIcon, amount: 0 }
        categoryMap[catName].amount += Math.abs(txn.amount || 0)
      })

    const topCategory = Object.values(categoryMap).sort((a, b) => b.amount - a.amount)[0] || null

    return { income, expense, balance, savingsRate, transactionCount, topCategory }
  }, [monthlyTransactions])

  // Chart 1: Monthly income/expense for each month of the selected year
  const yearlyMonthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: new Date(selectedYear, i, 1).toLocaleDateString('vi-VN', { month: 'short' }),
      income: 0,
      expense: 0,
    }))

    validTransactions.forEach(txn => {
      const txnDate = new Date(txn.date)
      if (txnDate.getFullYear() !== selectedYear) return
      const month = txnDate.getMonth()
      if (txn.type === 'income') months[month].income += Math.abs(txn.amount || 0)
      if (txn.type === 'expense') months[month].expense += Math.abs(txn.amount || 0)
    })

    return months
  }, [validTransactions, selectedYear])

  // Chart 2: Expense breakdown by category (top 10) for selected month
  const categoryBreakdown = useMemo(() => {
    const categoryMap = {}
    const totalExpense = monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

    monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .forEach(txn => {
        const catName = txn.categories?.name || 'Khác'
        const catIcon = txn.categories?.icon || '📁'
        if (!categoryMap[catName]) categoryMap[catName] = { name: catName, icon: catIcon, amount: 0, count: 0 }
        categoryMap[catName].amount += Math.abs(txn.amount || 0)
        categoryMap[catName].count += 1
      })

    return Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(cat => ({
        ...cat,
        percentage: totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0,
      }))
  }, [monthlyTransactions])

  // Chart 3: Cumulative net balance per day in selected month
  const dailyBalance = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      income: 0,
      expense: 0,
      net: 0,
      cumulative: 0,
    }))

    monthlyTransactions.forEach(txn => {
      const dayOfMonth = new Date(txn.date).getDate()
      if (dayOfMonth < 1 || dayOfMonth > daysInMonth) return
      const idx = dayOfMonth - 1
      if (txn.type === 'income') days[idx].income += Math.abs(txn.amount || 0)
      if (txn.type === 'expense') days[idx].expense += Math.abs(txn.amount || 0)
    })

    let cumulative = 0
    days.forEach(day => {
      day.net = day.income - day.expense
      cumulative += day.net
      day.cumulative = cumulative
    })

    return days
  }, [monthlyTransactions, selectedMonth, selectedYear])

  // Chart 4: Top 5 income sources (categories) in selected month
  const topIncomes = useMemo(() => {
    const categoryMap = {}
    monthlyTransactions
      .filter(txn => txn.type === 'income')
      .forEach(txn => {
        const catName = txn.categories?.name || 'Khác'
        const catIcon = txn.categories?.icon || '💰'
        if (!categoryMap[catName]) categoryMap[catName] = { name: catName, icon: catIcon, amount: 0, count: 0 }
        categoryMap[catName].amount += Math.abs(txn.amount || 0)
        categoryMap[catName].count += 1
      })

    return Object.values(categoryMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [monthlyTransactions])

  // Chart 5: Transaction count by week (income vs expense)
  const weeklyTransactions = useMemo(() => {
    const weeks = [
      { week: 'Tuần 1', income: 0, expense: 0 },
      { week: 'Tuần 2', income: 0, expense: 0 },
      { week: 'Tuần 3', income: 0, expense: 0 },
      { week: 'Tuần 4+', income: 0, expense: 0 },
    ]

    monthlyTransactions.forEach(txn => {
      const day = new Date(txn.date).getDate()
      const weekIndex = Math.min(Math.floor((day - 1) / 7), 3)
      if (txn.type === 'income') weeks[weekIndex].income += 1
      if (txn.type === 'expense') weeks[weekIndex].expense += 1
    })

    return weeks
  }, [monthlyTransactions])

  // Chart 6: Daily expense heatmap for selected month
  const dailyExpenseHeatmap = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const heatmap = {}
    for (let d = 1; d <= daysInMonth; d++) heatmap[d] = 0

    monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .forEach(txn => {
        const day = new Date(txn.date).getDate()
        if (day >= 1 && day <= daysInMonth) {
          heatmap[day] += Math.abs(txn.amount || 0)
        }
      })

    // First day of month weekday (0=Sun, 1=Mon, ...)
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay()

    return { heatmap, daysInMonth, firstDayOfWeek }
  }, [monthlyTransactions, selectedMonth, selectedYear])

  // Chart 7: Stacked bar chart - expense by category per week
  const weeklyCategories = useMemo(() => {
    const weeks = [
      { week: 'Tuần 1' },
      { week: 'Tuần 2' },
      { week: 'Tuần 3' },
      { week: 'Tuần 4+' },
    ]

    const categoryNames = new Set()

    monthlyTransactions
      .filter(txn => txn.type === 'expense')
      .forEach(txn => {
        const day = new Date(txn.date).getDate()
        const weekIndex = Math.min(Math.floor((day - 1) / 7), 3)
        const catName = txn.categories?.name || 'Khác'
        categoryNames.add(catName)
        if (!weeks[weekIndex][catName]) weeks[weekIndex][catName] = 0
        weeks[weekIndex][catName] += Math.abs(txn.amount || 0)
      })

    return { data: weeks, categories: Array.from(categoryNames) }
  }, [monthlyTransactions])

  // Chart 9: 3-month income/expense comparison
  const threeMonthComparison = useMemo(() => {
    const months = []
    for (let i = 2; i >= 0; i--) {
      let targetMonth = selectedMonth - i
      let targetYear = selectedYear
      if (targetMonth < 0) {
        targetMonth += 12
        targetYear -= 1
      }

      const monthTxns = validTransactions.filter(txn => {
        const txnDate = new Date(txn.date)
        return txnDate.getMonth() === targetMonth && txnDate.getFullYear() === targetYear
      })

      const income = monthTxns
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

      const expense = monthTxns
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0)

      months.push({
        name: new Date(targetYear, targetMonth, 1).toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
        income,
        expense,
      })
    }

    return months
  }, [validTransactions, selectedMonth, selectedYear])

  // Chart 10: Top 10 largest transactions in selected month
  const topTransactions = useMemo(() => {
    return [...monthlyTransactions]
      .sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0))
      .slice(0, 10)
  }, [monthlyTransactions])

  return {
    kpiData,
    yearlyMonthlyData,
    categoryBreakdown,
    dailyBalance,
    topIncomes,
    weeklyTransactions,
    dailyExpenseHeatmap,
    weeklyCategories,
    threeMonthComparison,
    topTransactions,
    monthlyTransactions,
  }
}
