      {/* STATS CARDS - 6 cards, 3 per row on large screens */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  
  {/* 1. Total Balance */}
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-blue-100 text-xs font-medium uppercase">Tổng Tài Sản</p>
        <p className="text-blue-100 text-xs">{stats.walletCount} ví</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
      {stats.totalBalance.toLocaleString('vi-VN')}
    </p>
    <p className="text-blue-100 text-sm font-medium">VND</p>
  </div>

  {/* 2. Income */}
  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-green-100 text-sm font-bold uppercase tracking-wider">Thu Nhập</p>
              <p className="text-green-200 text-xs mt-1">
                {displayStats.incomeCount} giao dịch
                {displayStats.tradePL > 0 && <><br/>+ {displayStats.tradeCount} trade</>}
              </p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
      +{displayStats.income.toLocaleString('vi-VN')}
    </p>
    <p className="text-green-100 text-sm font-medium">
        VND tháng này {displayStats.tradePL > 0 && '(bao gồm trade)'}
    </p>
  </div>

  {/* 3. Expense */}
  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-red-100 text-xs font-medium uppercase">Chi Tiêu</p>
        <p className="text-red-100 text-xs">{stats.expenseCount} giao dịch</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
        -{displayStats.expense.toLocaleString('vi-VN')}
    </p>
    <p className="text-red-100 text-sm font-medium">VND tháng này</p>
  </div>

  {/* 4. Trade P&L */}
  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-purple-100 text-xs font-medium uppercase">Trade P&L</p>
        <p className="text-purple-100 text-xs">{displayStats.tradeCount} lệnh đóng</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1 break-words">
        {displayStats.tradePL >= 0 ? '+' : ''}{displayStats.tradePL.toLocaleString('vi-VN')}
    </p>
    <p className="text-purple-100 text-sm font-medium">VND tổng P&L</p>
  </div>

  {/* 5. Total Transactions */}
  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-cyan-100 text-xs font-medium uppercase">Giao Dịch</p>
        <p className="text-cyan-100 text-xs">Tháng này</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1">
      {displayStats.transactionCount}
    </p>
    <p className="text-cyan-100 text-sm font-medium">
      {displayStats.incomeCount} thu / {stats.expenseCount} chi
    </p>
  </div>

  {/* 6. Savings Rate */}
  <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 md:p-3 bg-white/20 rounded-xl">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      </div>
      <div className="text-right">
        <p className="text-amber-100 text-xs font-medium uppercase">Tỷ Lệ Tiết Kiệm</p>
        <p className="text-amber-100 text-xs">Savings Rate</p>
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold mb-1">
      {displayStats.income > 0 ? (((displayStats.income - displayStats.expense) / displayStats.income) * 100).toFixed(1) : '0.0'}%
    </p>
    <p className="text-amber-100 text-sm font-medium">
      {displayStats.income > 0 ? 'của thu nhập' : 'Chưa có dữ liệu'}
    </p>
  </div>

</div>