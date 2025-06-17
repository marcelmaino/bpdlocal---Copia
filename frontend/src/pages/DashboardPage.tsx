import { useEffect } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import MetricsCards from '@/components/dashboard/MetricsCards'
import FiltersSection from '@/components/dashboard/FiltersSection'
import AIInsights from '@/components/dashboard/AIInsights'
import DataTable from '@/components/dashboard/DataTable'

const DashboardPage = () => {
  const { initializeDefaultDates } = useDashboardStore()

  useEffect(() => {
    // Initialize default dates on component mount
    initializeDefaultDates()
  }, [])

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <MetricsCards />
      
      {/* Filters Section */}
      <FiltersSection />
      
      {/* AI Insights */}
      {/* <AIInsights /> */}
      
      {/* Data Table */}
      <DataTable />
    </div>
  )
}

export default DashboardPage