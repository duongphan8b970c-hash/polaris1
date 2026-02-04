export default function GoalsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mục Tiêu & Dự Án</h2>
        <p className="text-gray-600 mt-1">Theo dõi tiến độ mục tiêu và công việc</p>
      </div>

      {/* Coming Soon */}
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Tính Năng Đang Phát Triển</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Hệ thống quản lý mục tiêu, dự án và công việc sẽ sớm được ra mắt với đầy đủ tính năng theo dõi tiến độ và hiệu suất.
        </p>
      </div>
    </div>
  )
}