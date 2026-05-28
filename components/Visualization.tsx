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
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  ZAxis
} from 'recharts';
import { ChartConfig, SheetData } from '../types';

interface VisualizationProps {
  config: ChartConfig;
  data: SheetData;
}

const COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#34d399', '#fbbf24', '#ef4444', '#60a5fa', '#10b981'];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color || COLORS[index % COLORS.length] }}>
            {entry.name}: {entry.value?.toFixed?.(2) ?? entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Visualization: React.FC<VisualizationProps> = ({ config, data }) => {
  // Transform sheet data for charts
  const chartData = React.useMemo(() => {
    return data.rows.slice(0, 100).map((row, index) => {
      const dataValue = Number(row[config.dataKey]) || 0;
      const secondValue = config.secondDataKey ? Number(row[config.secondDataKey]) || 0 : 0;
      
      return {
        ...row,
        [config.dataKey]: dataValue,
        [config.secondDataKey || '']: secondValue,
        // For scatter/bubble charts
        x: Number(row[config.xAxisKey]) || index,
        y: dataValue,
        z: config.secondDataKey ? secondValue : dataValue / 2,
        // For funnel/waterfall
        value: dataValue,
        label: row[config.xAxisKey] || `Item ${index + 1}`
      };
    });
  }, [data.rows, config.dataKey, config.xAxisKey, config.secondDataKey]);

  const renderChart = () => {
    const commonProps = {
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    switch (config.type) {
      case 'bar':
        return (
          <BarChart data={chartData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
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
          <LineChart data={chartData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type={config.curveType || 'monotone'}
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
          <AreaChart data={chartData} {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type={config.curveType || 'monotone'} 
              dataKey={config.dataKey} 
              stroke="#22d3ee" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
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

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="x" name={config.xAxisKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis dataKey="y" name={config.dataKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name={config.dataKey} data={chartData} fill="#22d3ee" line={{ stroke: '#22d3ee', strokeWidth: 2 }} />
          </ScatterChart>
        );

      case 'bubble':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="x" name={config.xAxisKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis dataKey="y" name={config.dataKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <ZAxis dataKey="z" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {chartData.map((entry, index) => (
              <Scatter
                key={`bubble-${index}`}
                data={[{ x: entry.x, y: entry.y, z: entry.z }]}
                fill={COLORS[index % COLORS.length]}
                line={{ stroke: COLORS[index % COLORS.length], strokeWidth: 1 }}
              />
            ))}
          </ScatterChart>
        );

      case 'combo':
        return (
          <ComposedChart data={chartData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={config.xAxisKey} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey={config.dataKey} fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey={config.secondDataKey || config.dataKey} stroke="#a855f7" strokeWidth={3} dot={false} />
          </ComposedChart>
        );

      case 'waterfall':
        const waterfallData = chartData.map((item, index) => {
          const prevTotal = index === 0 ? 0 : chartData.slice(0, index).reduce((sum, d) => sum + d.value, 0);
          return {
            ...item,
            prevTotal,
            total: prevTotal + item.value
          };
        });

        return (
          <BarChart data={waterfallData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" stackId="a" fill="#334155" />
            <Bar dataKey="value" stackId="b" fill="#22d3ee">
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#22d3ee' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'funnel':
        const funnelData = chartData
          .map(item => ({ ...item, value: Math.abs(item.value) }))
          .sort((a, b) => b.value - a.value);
        const maxValue = Math.max(...funnelData.map(d => d.value));

        return (
          <BarChart data={funnelData} layout="vertical" {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis dataKey="label" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  width={(entry.value / maxValue) * 100}
                />
              ))}
            </Bar>
          </BarChart>
        );

      case 'gauge':
        const targetValue = config.targetValue || 100;
        const currentValue = chartData.length > 0 ? chartData[0].value : 0;
        const percentage = Math.min((currentValue / targetValue) * 100, 100);
        
        const gaugeData = [
          { name: 'Completed', value: percentage, color: '#22d3ee' },
          { name: 'Remaining', value: 100 - percentage, color: '#334155' }
        ];

        return (
          <div className="flex flex-col items-center justify-center h-full">
            <PieChart width={200} height={200}>
              <Pie
                data={gaugeData}
                cx={100}
                cy={100}
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="text-center -mt-16">
              <p className="text-3xl font-bold text-white">{currentValue.toFixed(1)}</p>
              <p className="text-sm text-slate-400">of {targetValue}</p>
              <p className="text-lg font-semibold text-cyan-400">{percentage.toFixed(1)}%</p>
            </div>
          </div>
        );

      case 'heatmap':
        // Transform data for heatmap
        const heatmapData = chartData.map((item, index) => ({
          ...item,
          index,
          intensity: item.value / Math.max(...chartData.map(d => d.value)) * 100
        }));

        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(heatmapData.length))}, 1fr)` }}>
              {heatmapData.map((item, index) => {
                const intensity = item.intensity;
                const color = `rgba(34, 211, 238, ${intensity / 100})`;
                return (
                  <div
                    key={index}
                    className="aspect-square rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: color, color: intensity > 50 ? '#0f172a' : '#e2e8f0' }}
                    title={`${item.label}: ${item.value}`}
                  >
                    {item.value.toFixed(1)}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Low</span>
              <div className="flex-1 mx-4 h-3 rounded bg-gradient-to-r from-slate-700 to-cyan-400" />
              <span>High</span>
            </div>
          </div>
        );

      case 'sparkline':
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <Line
              type="monotone"
              dataKey={config.dataKey}
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      default:
        return <div className="text-red-400">Unsupported chart type: {config.type}</div>;
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col p-4 glass-panel rounded-xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{config.title}</h3>
        <p className="text-xs text-slate-400">{config.description}</p>
      </div>
      <div className="flex-1 w-full min-h-[250px]">
        {config.type === 'gauge' || config.type === 'heatmap' ? (
          renderChart()
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart() as React.ReactElement}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Visualization;
