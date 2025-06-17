import React from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Settings } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

interface ColumnVisibilityControlProps {
  columns: ColumnConfig[];
  onColumnToggle: (columnKey: string) => void;
}

export const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  columns,
  onColumnToggle,
}) => {
  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Settings size={16} />
          <span>Colunas ({visibleCount}/{totalCount})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Visibilidade das Colunas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={column.visible}
              onCheckedChange={() => onColumnToggle(column.key)}
              className="flex items-center space-x-2"
            >
              <span className="flex-1">{column.label}</span>
              {column.sortable && (
                <span className="text-xs text-gray-500">Ordenável</span>
              )}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              columns.forEach(col => {
                if (!col.visible) onColumnToggle(col.key);
              });
            }}
            className="w-full justify-start text-xs"
          >
            Mostrar Todas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Manter apenas as colunas essenciais visíveis
              const essentialColumns = [' dia', ' playerName', ' club', ' agentName', ' realWins'];
              columns.forEach(col => {
                if (col.visible && !essentialColumns.includes(col.key)) {
                  onColumnToggle(col.key);
                }
              });
            }}
            className="w-full justify-start text-xs mt-1"
          >
            Mostrar Apenas Essenciais
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};