import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, X, Plus, Settings } from 'lucide-react';
import { createAdvancedPivot, createSlicerOptions, createTimelineData } from '../services/advancedPivotService';
import { SheetData, ChartConfig, PivotConfig, PivotField } from '../types';
import Visualization from './Visualization';
import Slicer from './Slicer';
import Timeline from './Timeline';

interface PivotChartPanelProps {
  data: SheetData;
  onAddToDashboard: (config: ChartConfig) => void;
  onClose: () => void;
}

const PivotChartPanel: React.FC<PivotChartPanelProps> = ({
  data,
  onAddToDashboard,
  onClose
}) => {
  const [rowFields, setRowFields] = useState<string[]>([]);
  const [columnFields, setColumnFields] = useState<string[]>([]);
  const [valueFields, setValueFields] = useState<PivotField[]>([]);
  const [slicerFields, setSlicerFields] = useState<Record<string, any[]>>({});
  const [timelineField, setTimelineField] = useState<string | null>(null);
  const [timelineRange, setTimelineRange] = useState<{ start: string; end: string } | null>(null);
  const [showSlicerFor, setShowSlicerFor] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Create pivot result
  const pivotResult = useMemo(() => {
    if (rowFields.length === 0 || valueFields.length === 0) return null;

    const config: PivotConfig = {
      rowFields,
      columnFields,
      valueFields,
      filterFields: slicerFields,
      dateField: timelineField || undefined,
      dateRange: timelineRange || undefined
    };

    return createAdvancedPivot(data, config);
  }, [data, rowFields, columnFields, valueFields, slicerFields, timelineField, timelineRange]);

  // Get available fields
  const usedFields = new Set([
    ...rowFields,
    ...columnFields,
    ...valueFields.map(v => v.field)
  ]);

  const availableFields = data.columns.filter(f => !usedFields.has(f));

  const handleAddRowField = (field: string) => {
    if (!rowFields.includes(field)) {
      setRowFields([...rowFields, field]);
    }
  };

  const handleAddValueField = (field: string, operation: PivotField['operation'] = 'sum') => {
    if (!valueFields.find(v => v.field === field)) {
      setValueFields([...valueFields, { field, operation }]);
    }
  };

  const handleRemoveRowField = (field: string) => {
    setRowFields(rowFields.filter(f => f !== field));
  };

  const handleRemoveValueField = (field: string) => {
    setValueFields(valueFields.filter(v => v.field !== field));
  };

  const handleSlicerChange = (field: string, selectedValues: any[]) => {
    if (selectedValues.length === 0) {
      const { [field]: _, ...rest } = slicerFields;
      setSlicerFields(rest);
    } else {
      setSlicerFields({ ...slicerFields, [field]: selectedValues });
    }
  };

  const handleTimelineChange = (start: string, end: string) => {
    setTimelineRange({ start, end });
  };

  const handleAddToDashboard = () => {
    if (pivotResult && pivotResult.chartConfigs) {
      pivotResult.chartConfigs.forEach(config => {
        onAddToDashboard(config);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-700 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pivot Chart Builder</h2>
              <p className="text-xs text-slate-400">Create dynamic pivot tables and charts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToDashboard}
              disabled={!pivotResult}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add to Dashboard
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Area */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          {/* Row Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Rows</label>
              <span className="text-xs text-slate-500">{rowFields.length} field(s)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableFields.map(field => (
                <button
                  key={field}
                  onClick={() => handleAddRowField(field)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
                >
                  + {field}
                </button>
              ))}
              {rowFields.map(field => (
                <span
                  key={field}
                  className="px-2 py-1 bg-purple-500/20 border border-purple-400 rounded text-xs text-purple-400 flex items-center gap-1"
                >
                  {field}
                  <button onClick={() => handleRemoveRowField(field)} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Value Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Values</label>
              <span className="text-xs text-slate-500">{valueFields.length} field(s)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableFields.map(field => (
                <button
                  key={field}
                  onClick={() => handleAddValueField(field)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors"
                >
                  + {field} (Sum)
                </button>
              ))}
              {valueFields.map(v => (
                <span
                  key={v.field}
                  className="px-2 py-1 bg-cyan-500/20 border border-cyan-400 rounded text-xs text-cyan-400 flex items-center gap-1"
                >
                  {v.operation}({v.field})
                  <button onClick={() => handleRemoveValueField(v.field)} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Slicers & Timeline */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setShowSlicerFor(showSlicerFor ? null : data.columns[0])}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
            >
              <Settings className="w-3 h-3" /> Add Slicer
            </button>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`px-2 py-1 border rounded text-xs transition-colors flex items-center gap-1 ${
                showTimeline
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3 h-3" /> Timeline
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-4">
          {pivotResult && pivotResult.chartConfigs && pivotResult.chartConfigs.length > 0 ? (
            <div className="h-full">
              <Visualization config={pivotResult.chartConfigs[0]} data={{ ...data, rows: pivotResult.rows, columns: pivotResult.columns }} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Add row and value fields to create a pivot chart</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Slicers & Timeline */}
      <div className="w-80 bg-slate-900/50 p-4 space-y-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-white mb-2">Filters</h3>
        
        {/* Slicers */}
        {Object.entries(slicerFields).map(([field, values]) => (
          <Slicer
            key={field}
            data={data}
            field={field}
            onFilterChange={handleSlicerChange}
            onClose={() => handleSlicerChange(field, [])}
          />
        ))}

        {/* Add Slicer Dropdown */}
        {showSlicerFor && (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">Select field for slicer:</span>
              <button onClick={() => setShowSlicerFor(null)} className="text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {data.columns.map(field => (
                <button
                  key={field}
                  onClick={() => {
                    setShowSlicerFor(null);
                    if (!slicerFields[field]) {
                      setSlicerFields({ ...slicerFields, [field]: [] });
                    }
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors"
                >
                  {field}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && timelineField && (
          <Timeline
            data={data}
            dateField={timelineField}
            onRangeChange={handleTimelineChange}
            onClose={() => {
              setShowTimeline(false);
              setTimelineField(null);
              setTimelineRange(null);
            }}
          />
        )}

        {showTimeline && !timelineField && (
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">Select date field:</span>
              <button onClick={() => setShowTimeline(false)} className="text-slate-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {data.columns.map(field => (
                <button
                  key={field}
                  onClick={() => {
                    setTimelineField(field);
                    setShowTimeline(false);
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors"
                >
                  📅 {field}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PivotChartPanel;
