import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import MultiSelect from '@/components/ui/multi-select'
import axios from 'axios'

interface FilterOptions {
  clubs: string[]
  agents: string[]
  players: string[]
}

const FiltersSection = () => {
  const { filters, setFilters, clearFilters } = useDashboardStore()
  const { user } = useAuthStore()
  const [searchValue, setSearchValue] = useState(filters.search)

  // Fetch filter options
  const { data: filterOptions, isLoading } = useQuery<FilterOptions>({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard/filters')
      return response.data.data
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 300000 // 5 minutes
  })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchValue })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchValue, setFilters])

  const handleClubsChange = (clubs: string[]) => {
    setFilters({ clubs })
  }

  const handleAgentsChange = (agents: string[]) => {
    setFilters({ agents })
  }

  const handlePlayersChange = (players: string[]) => {
    setFilters({ players })
  }

  const handleClearFilters = () => {
    setSearchValue('')
    clearFilters()
  }

  const hasActiveFilters = 
    filters.search || 
    filters.clubs.length > 0 || 
    filters.agents.length > 0 || 
    filters.players.length > 0

  // Hide player filter for non-admin users
  const showPlayerFilter = user?.role === 'admin'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <X size={16} />
                <span>Limpar Filtros</span>
              </Button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Global Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Pesquisa Global
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Pesquisar jogador, agente, clube..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Club Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Clubes
              </label>
              <MultiSelect
                options={filterOptions?.clubs || []}
                selected={filters.clubs}
                onChange={handleClubsChange}
                placeholder="Selecionar clubes"
                isLoading={isLoading}
              />
            </div>

            {/* Agent Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Agentes
              </label>
              <MultiSelect
                options={filterOptions?.agents || []}
                selected={filters.agents}
                onChange={handleAgentsChange}
                placeholder="Selecionar agentes"
                isLoading={isLoading}
              />
            </div>

            {/* Player Filter - Only for admin */}
            {showPlayerFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Jogadores
                </label>
                <MultiSelect
                  options={filterOptions?.players || []}
                  selected={filters.players}
                  onChange={handlePlayersChange}
                  placeholder="Selecionar jogadores"
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Busca: "{filters.search}"
                  </span>
                )}
                
                {filters.clubs.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {filters.clubs.length} clube(s)
                  </span>
                )}
                
                {filters.agents.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {filters.agents.length} agente(s)
                  </span>
                )}
                
                {filters.players.length > 0 && showPlayerFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {filters.players.length} jogador(es)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FiltersSection