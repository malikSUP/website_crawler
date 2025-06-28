import React from 'react';
import { Activity, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Task } from '../types';

interface QuickStatsProps {
  tasks: Task[];
  isLoading: boolean;
}

const QuickStats: React.FC<QuickStatsProps> = ({ tasks, isLoading }) => {
  const activeTasks = tasks.filter(t => t.status === 'running').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  
  const successRate = (completedTasks + failedTasks) > 0 
    ? Math.round((completedTasks / (completedTasks + failedTasks)) * 100)
    : 0;

  const statItems = [
    {
      label: 'Active Tasks',
      value: activeTasks,
      icon: Activity,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20',
      description: 'Currently running'
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
      description: 'Successfully finished'
    },
    {
      label: 'Total Tasks',
      value: tasks.length,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      description: 'All tasks created'
    }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center text-white">
          <div className="bg-green-500/20 p-2 rounded-lg mr-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          📊 Quick Stats
        </h3>
        
        {/* Success Rate Badge */}
        {(completedTasks + failedTasks) > 0 && (
          <div className="flex items-center space-x-2 bg-slate-700/50 rounded-lg px-3 py-1">
            <span className="text-xs text-slate-400">Success Rate</span>
            <span className={`text-sm font-bold ${
              successRate >= 80 ? 'text-green-400' : 
              successRate >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {successRate}%
            </span>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-600 rounded mb-2"></div>
                    <div className="h-6 bg-slate-500 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index} 
                className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4 transition-all hover:scale-105 hover:border-opacity-50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${item.color.replace('text-', 'bg-').replace('400', '500/20')} p-2 rounded-lg border ${item.borderColor}`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <span className="text-white font-semibold">{item.label}</span>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-2xl ${item.color}`}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Failed Tasks Warning */}
          {failedTasks > 0 && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-500/20 p-2 rounded-lg border border-red-400/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Failed Tasks</span>
                    <p className="text-xs text-slate-400 mt-1">Tasks that encountered errors</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-2xl text-red-400">
                    {failedTasks}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary Message */}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Start parsing websites to see your statistics here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickStats; 