import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { ChartConfig, SheetData } from '../types';

interface VisualizationProps {
  config: ChartConfig;
  data: SheetData;
}

const Visualization: React.FC<VisualizationProps> = ({ config, data }) => {
  // Transform sheet data for the chart
  // We need to map the sheet rows to a format Recharts accepts, ensuring numbers are numbers
  const chartData = React.useMemo(() => {
    return data.rows.slice(0, 50).map(row => ({
      ...row,
      [config.dataKey]: Number(row[config.dataKey]) || 0,
    }));
  }, [data.rows, config.dataKey]);

  const COLORS = config.colors || ['#22d3ee', '#a855f7', '#f472b6', '#34d399'];

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
                dataKey={config.xAxisKey} 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={{ stroke: '#334155' }}
            />
            <YAxis 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                tickLine={{ stroke: '#334155' }}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                itemStyle={{ color: '#22d3ee' }}
                cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
            />
            <Legend />
            <Bar dataKey={config.dataKey} fill="#22d3ee" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Legend />
            <Line 
                type="monotone" 
                dataKey={config.dataKey} 
                stroke="#a855f7" 
                strokeWidth={3} 
                dot={{ fill: '#0f172a', stroke: '#a855f7', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#f472b6' }}
            />
          </LineChart>
        );
      case 'area':
        return (
           <AreaChart data={chartData}>
            <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Area type="monotone" dataKey={config.dataKey} stroke="#22d3ee" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
             <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
             <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey={config.dataKey}
              nameKey={config.xAxisKey}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        );
      default:
        return <div className="text-red-400">Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col p-4 glass-panel rounded-xl">
        <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">{config.title}</h3>
            <p className="text-xs text-slate-400">{config.description}</p>
        </div>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Visualization;