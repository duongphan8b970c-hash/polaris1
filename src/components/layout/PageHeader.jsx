export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
