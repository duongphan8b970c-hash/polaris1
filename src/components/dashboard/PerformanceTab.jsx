export default function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hiệu Suất</h2>
        <p className="text-gray-600 mt-1">Phân tích và đánh giá hiệu suất công việc</p>
      </div>

      {/* Coming Soon */}
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Tính Năng Đang Phát Triển</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Dashboard phân tích hiệu suất với biểu đồ chi tiết và báo cáo sẽ sớm được cập nhật.
        </p>
      </div>
    </div>
  )
}