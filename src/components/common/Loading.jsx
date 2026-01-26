export default function Loading({ message = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="spinner w-12 h-12"></div>
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  )
}
