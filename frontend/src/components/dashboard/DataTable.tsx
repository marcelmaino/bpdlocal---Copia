import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Search, Download, Filter, Calculator, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import axios from 'axios'
import { ColumnVisibilityControl, ColumnConfig } from './ColumnVisibilityControl'

interface TableData {
  linha_id: number
  ' dia': string
  ' club': string
  ' playerName': string
  ' agentName': string
  ' hands': number
  ' realWins': number
  ' moeda': string
}

interface TableResponse {
  success: boolean
  data: TableData[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type SortField = ' dia' | ' playerName' | ' agentName' | ' club' | ' hands' | ' realWins'
type SortDirection = 'asc' | 'desc'

const DataTable = () => {
  const [sortField, setSortField] = useState<SortField>(' dia')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [localSearch, setLocalSearch] = useState('')
  const [showSummary, setShowSummary] = useState(true)
  
  // Configuração das colunas
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: ' dia', label: 'Data', visible: true, sortable: true },
    { key: ' reference', label: 'Referência', visible: false },
    { key: ' share', label: 'Share', visible: false },
    { key: ' moeda', label: 'Moeda', visible: true },
    { key: ' upline', label: 'Upline', visible: false },
    { key: ' club', label: 'Clube', visible: true, sortable: true },
    { key: ' playerID', label: 'Player ID', visible: false },
    { key: ' playerName', label: 'Jogador', visible: true, sortable: true },
    { key: ' agentName', label: 'Agente', visible: true, sortable: true },
    { key: ' agentId', label: 'Agent ID', visible: false },
    { key: ' superAgentName', label: 'Super Agente', visible: false },
    { key: ' superagentId', label: 'Super Agent ID', visible: false },
    { key: ' localWins', label: 'Local Wins', visible: false },
    { key: ' localFee', label: 'Local Fee', visible: false },
    { key: ' hands', label: 'Mãos', visible: true, sortable: true },
    { key: ' dolarWins', label: 'Dólar Wins', visible: false },
    { key: ' dolarFee', label: 'Dólar Fee', visible: false },
    { key: ' dolarRakeback', label: 'Dólar Rakeback', visible: false },
    { key: ' dolarRebate', label: 'Dólar Rebate', visible: false },
    { key: ' realWins', label: 'Real Wins', visible: true, sortable: true },
    { key: ' realFee', label: 'Real Fee', visible: false },
    { key: ' realRakeback', label: 'Real Rakeback', visible: false },
    { key: ' realRebate', label: 'Real Rebate', visible: false },
    { key: ' realAgentSett', label: 'Real Agent Sett', visible: false },
    { key: ' dolarAgentSett', label: 'Dólar Agent Sett', visible: false },
    { key: ' realRevShare', label: 'Real Rev Share', visible: false },
    { key: ' realBPFProfit', label: 'Real BPF Profit', visible: false },
    { key: ' deal', label: 'Deal', visible: false },
    { key: ' rebate', label: 'Rebate', visible: false }
  ]);
  
  const handleColumnToggle = (columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  };
  
  const visibleColumns = columns.filter(col => col.visible);
  
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: tableData, isLoading, error } = useQuery<TableResponse>({
    queryKey: ['table-data', getDateRangeForAPI(), currency, filters, user?.id, sortField, sortDirection, page, limit],
    queryFn: async () => {
      const { startDate, endDate } = getDateRangeForAPI()
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortField,
        sortDirection
      })
      
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.clubs.length > 0) params.append('clubs', filters.clubs.join(','))
      if (filters.agents.length > 0) params.append('agents', filters.agents.join(','))
      if (filters.players.length > 0) params.append('players', filters.players.join(','))
      
      const response = await axios.get(`/api/bpd-data?${params.toString()}`)
      return response.data
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    keepPreviousData: true
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setPage(1)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  const filteredData = tableData?.data.filter(row => {
    if (!localSearch) return true
    const searchLower = localSearch.toLowerCase()
    return (
      row[' club'].toLowerCase().includes(searchLower) ||
      row[' agentName'].toLowerCase().includes(searchLower) ||
      row[' playerName'].toLowerCase().includes(searchLower) ||
      row[' dia'].includes(searchLower)
    )
  }) || []

  // Cálculo dos totais das colunas visíveis
  const calculateSummary = () => {
    const numericColumns = [
      ' localWins', ' localFee', ' hands', ' dolarWins', ' dolarFee', 
      ' dolarRakeback', ' dolarRebate', ' realWins', ' realFee', 
      ' realRakeback', ' realRebate', ' realAgentSett', ' dolarAgentSett', 
      ' realRevShare', ' realBPFProfit', ' rebate'
    ];
    
    const summary: Record<string, number> = {};
    
    visibleColumns.forEach(column => {
      if (numericColumns.includes(column.key)) {
        summary[column.key] = filteredData.reduce((sum, row) => {
          const value = row[column.key] || 0;
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
      }
    });
    
    return summary;
  };
  
  const summaryData = calculateSummary();

  const totalPages = tableData?.totalPages || 0

  const exportData = () => {
    // In a real implementation, this would trigger a CSV/Excel export
    console.log('Exporting data...', filteredData)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar dados da tabela</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Dados Detalhados</span>
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <ColumnVisibilityControl
              columns={columns}
              onColumnToggle={handleColumnToggle}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center space-x-2"
            >
              {showSummary ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showSummary ? 'Ocultar' : 'Mostrar'} Totais</span>
            </Button>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Buscar na tabela..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(parseInt(value));
              setPage(1);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="25">25 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
                <SelectItem value="200">200 por página</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              className="flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Exportar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Table */}
              <div className="w-full overflow-x-auto">
                <div className="min-w-max">
                  <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {visibleColumns.map((column) => {
                      const isNumericColumn = [
                        ' localWins', ' localFee', ' hands', ' dolarWins', ' dolarFee', 
                        ' dolarRakeback', ' dolarRebate', ' realWins', ' realFee', 
                        ' realRakeback', ' realRebate', ' realAgentSett', ' dolarAgentSett', 
                        ' realRevShare', ' realBPFProfit', ' rebate'
                      ].includes(column.key);
                      
                      return (
                        <th 
                          key={column.key} 
                          className={cn(
                            "p-2 text-xs",
                            isNumericColumn ? "text-right" : "text-left"
                          )}
                        >
                          {column.sortable ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort(column.key)}
                              className={cn(
                                "flex items-center space-x-1 font-medium text-xs",
                                isNumericColumn ? "justify-end" : "justify-start"
                              )}
                            >
                              <span>{column.label}</span>
                              {getSortIcon(column.key)}
                            </Button>
                          ) : (
                            <span className="font-medium">{column.label}</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.linha_id} className="border-b border-gray-100 hover:bg-gray-50">
                      {visibleColumns.map((column) => {
                        const isNumericColumn = [
                          ' localWins', ' localFee', ' hands', ' dolarWins', ' dolarFee', 
                          ' dolarRakeback', ' dolarRebate', ' realWins', ' realFee', 
                          ' realRakeback', ' realRebate', ' realAgentSett', ' dolarAgentSett', 
                          ' realRevShare', ' realBPFProfit', ' rebate'
                        ].includes(column.key);
                        
                        const isWinsColumn = [' localWins', ' dolarWins', ' realWins'].includes(column.key);
                        
                        const renderCellContent = () => {
                          const value = row[column.key];
                          
                          // Formatação especial para diferentes tipos de colunas
                          switch (column.key) {
                            case ' dia':
                              return new Date(value).toLocaleDateString('pt-BR');
                            
                            case ' moeda':
                              return (
                                <span className="px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                  {value}
                                </span>
                              );
                            
                            case ' club':
                              return <span className="font-medium">{value}</span>;
                            
                            case ' hands':
                            case ' rebate':
                              return formatNumber(value || 0);
                            
                            case ' localWins':
                            case ' localFee':
                            case ' realWins':
                            case ' realFee':
                            case ' realRakeback':
                            case ' realRebate':
                            case ' realAgentSett':
                              if (isWinsColumn) {
                                return (
                                  <span className={cn(
                                    "font-medium",
                                    (value || 0) >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {formatCurrency(value || 0, row[' moeda'])}
                                  </span>
                                );
                              }
                              return formatCurrency(value || 0, row[' moeda']);
                            
                            case ' dolarWins':
                            case ' dolarFee':
                            case ' dolarRakeback':
                            case ' dolarRebate':
                            case ' dolarAgentSett':
                              if (isWinsColumn) {
                                return (
                                  <span className={cn(
                                    "font-medium",
                                    (value || 0) >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {formatCurrency(value || 0, 'USD')}
                                  </span>
                                );
                              }
                              return formatCurrency(value || 0, 'USD');
                            
                            default:
                              return value || '-';
                          }
                        };
                        
                        return (
                          <td 
                            key={column.key} 
                            className={cn(
                              "p-2 text-xs",
                              isNumericColumn ? "text-right" : "text-left"
                            )}
                          >
                            {renderCellContent()}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </div>

            {/* Summary Row */}
            {showSummary && Object.keys(summaryData).length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2 mb-3">
                  <Calculator size={16} className="text-blue-600" />
                  <h3 className="font-semibold text-sm text-gray-700">Totais da Página Atual ({filteredData.length} registros)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleColumns
                    .filter(column => summaryData[column.key] !== undefined)
                    .map(column => {
                      const value = summaryData[column.key];
                      const isWinsColumn = [' localWins', ' dolarWins', ' realWins'].includes(column.key);
                      const isDolarColumn = column.key.includes('dolar');
                      const currency = isDolarColumn ? 'USD' : 'BRL';
                      
                      return (
                        <div key={column.key} className="bg-white p-3 rounded border">
                          <div className="text-xs text-gray-500 mb-1">{column.label}</div>
                          <div className={cn(
                            "font-semibold text-sm",
                            isWinsColumn && value >= 0 ? "text-green-600" : 
                            isWinsColumn && value < 0 ? "text-red-600" : "text-gray-900"
                          )}>
                            {column.key === ' hands' || column.key === ' rebate' ? 
                              formatNumber(value) : 
                              formatCurrency(value, currency)
                            }
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, tableData?.total || 0)} de {tableData?.total || 0} registros
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      const pageNumber = Math.max(1, Math.min(totalPages - 4, page - 2)) + index
                      return (
                        <Button
                          key={pageNumber}
                          variant={page === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default DataTable