import WalletCard from './WalletCard'

export default function WalletList({ wallets, onEdit, onDelete, onResetBalance }) {
  if (wallets.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <p className="text-gray-500">Chưa có ví nào. Tạo ví đầu tiên của bạn!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wallets.map(wallet => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          onEdit={onEdit}
          onDelete={onDelete}
          onResetBalance={onResetBalance}
        />
      ))}
    </div>
  )
}