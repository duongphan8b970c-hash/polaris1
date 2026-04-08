import PageHeader from '../../components/layout/PageHeader'
import TradeTimeline from '../../components/trades/TradeTimeline'
import MarketNewsArea from '../../components/trades/MarketNewsArea'
import { useTradePlanningAnalyses } from '../../hooks/finance/useTradePlanningAnalyses'

export default function TradePlanning() {
  const { analyses, addAnalysis, updateAnalysis, deleteAnalysis } = useTradePlanningAnalyses()

  return (
    <div>
      <PageHeader
        title="Lên Kế Hoạch Trade"
        subtitle="Theo dõi phân tích và cập nhật tin tức thị trường để đưa ra quyết định tốt hơn"
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Timeline — wider column */}
        <div className="xl:col-span-3">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <TradeTimeline
              analyses={analyses}
              onAdd={addAnalysis}
              onUpdate={updateAnalysis}
              onDelete={deleteAnalysis}
            />
          </div>
        </div>

        {/* Market News — narrower column */}
        <div className="xl:col-span-2">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto">
            <MarketNewsArea />
          </div>
        </div>
      </div>
    </div>
  )
}
