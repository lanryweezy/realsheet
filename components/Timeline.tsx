import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { createTimelineData, applyTimelineFilter } from '../services/advancedPivotService';
import { SheetData } from '../types';

interface TimelineProps {
  data: SheetData;
  dateField: string;
  title?: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  onClose?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({
  data,
  dateField,
  title = dateField,
  onRangeChange,
  onClose
}) => {
  const timelineData = useMemo(() => createTimelineData(data, dateField), [data, dateField]);
  
  const [startDate, setStartDate] = useState(timelineData.min);
  const [endDate, setEndDate] = useState(timelineData.max);
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('month');

  // Generate timeline groups based on view mode
  const groups = useMemo(() => {
    if (!timelineData.groups) return [];

    if (viewMode === 'year') {
      // Group by year
      const yearGroups: Map<string, number> = new Map();
      timelineData.groups.forEach(g => {
        const year = g.date.split('-')[0];
        yearGroups.set(year, (yearGroups.get(year) || 0) + g.count);
      });
      return Array.from(yearGroups.entries()).map(([date, count]) => ({ date, count }));
    }

    if (viewMode === 'quarter') {
      // Group by quarter
      const quarterGroups: Map<string, number> = new Map();
      timelineData.groups.forEach(g => {
        const [year, month] = g.date.split('-');
        const quarter = `Q${Math.ceil(parseInt(month) / 3)}-${year}`;
        quarterGroups.set(quarter, (quarterGroups.get(quarter) || 0) + g.count);
      });
      return Array.from(quarterGroups.entries()).map(([date, count]) => ({ date, count }));
    }

    return timelineData.groups;
  }, [timelineData, viewMode]);

  const handleRangeChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    onRangeChange(newStart, newEnd);
  };

  const handlePresetRange = (preset: 'all' | 'last30' | 'last90' | 'thisYear') => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset) {
      case 'all':
        start = new Date(timelineData.min);
        end = new Date(timelineData.max);
        break;
      case 'last30':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    handleRangeChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  const totalItems = useMemo(() => {
    return groups
      .filter(g => {
        const gDate = new Date(g.date + '-01');
        const start = new Date(startDate);
        const end = new Date(endDate);
        return gDate >= start && gDate <= end;
      })
      .reduce((sum, g) => sum + g.count, 0);
  }, [groups, startDate, endDate]);

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-lg p-4 min-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{totalItems} items</span>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* View Mode & Presets */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === 'month'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('quarter')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === 'quarter'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            Quarter
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewMode === 'year'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            Year
          </button>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => handlePresetRange('last30')}
            className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
          >
            Last 30
          </button>
          <button
            onClick={() => handlePresetRange('last90')}
            className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
          >
            Last 90
          </button>
          <button
            onClick={() => handlePresetRange('thisYear')}
            className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
          >
            This Year
          </button>
        </div>
      </div>

      {/* Date Range Inputs */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleRangeChange(e.target.value, endDate)}
          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleRangeChange(startDate, e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Timeline Visualization */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {groups.map((group, index) => {
          const gDate = new Date(group.date + '-01');
          const isSelected = gDate >= new Date(startDate) && gDate <= new Date(endDate);
          const maxCount = Math.max(...groups.map(g => g.count));
          const width = (group.count / maxCount) * 100;

          return (
            <div
              key={index}
              className={`flex items-center gap-2 p-1 rounded cursor-pointer transition-colors ${
                isSelected ? 'bg-cyan-500/20' : 'hover:bg-slate-700'
              }`}
              onClick={() => {
                if (isSelected) {
                  handleRangeChange(startDate, group.date);
                } else {
                  handleRangeChange(group.date, endDate);
                }
              }}
            >
              <span className="text-xs text-slate-300 w-16">{group.date}</span>
              <div className="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isSelected ? 'bg-cyan-400' : 'bg-slate-500'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right">{group.count}</span>
            </div>
          );
        })}
      </div>

      {/* Reset Button */}
      <button
        onClick={() => handlePresetRange('all')}
        className="w-full mt-3 px-2 py-1.5 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
      >
        Reset to Full Range
      </button>
    </div>
  );
};

export default Timeline;
