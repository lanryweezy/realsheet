import React from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { DashboardItem, SheetData } from '../types';
import Visualization from './Visualization';

interface DashboardProps {
  items: DashboardItem[];
  sheetData: SheetData;
  onRemoveItem: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, sheetData, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="p-4 bg-slate-800/50 rounded-full mb-4 ring-1 ring-slate-700">
          <LayoutGrid className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">Dashboard is Empty</h3>
        <p className="max-w-md text-center mt-2 text-sm">
          Ask the Agent to create charts, then click "Pin to Dashboard" to organize your insights here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="relative group bg-slate-900/40 border border-slate-700/50 rounded-xl p-1 backdrop-blur-sm hover:border-nexus-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/10"
          >
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRemoveItem(item.id)}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg border border-slate-600/50"
                title="Remove from Dashboard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-[300px] w-full">
               <Visualization config={item.chartConfig} data={sheetData} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;