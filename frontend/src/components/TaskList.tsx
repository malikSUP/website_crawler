import React from 'react';
import { 
  FileText, Filter, Eye, Clock, CheckCircle, AlertCircle, 
  Download
} from 'lucide-react';
import { formatRelativeTime, getTaskStatusColor, getTaskStatusBg, exportTaskToCSV } from '../utils';
import type { Task, TaskFilter } from '../types';

interface TaskListProps {
  tasks: Task[];
  taskFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onTaskClick: (task: Task) => void;
  isLoading: boolean;
  showDownload?: (message: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  taskFilter,
  onFilterChange,
  onTaskClick,
  isLoading,
  showDownload
}) => {
  
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleExportTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    exportTaskToCSV(task, undefined, (filename, count) => {
      if (showDownload) {
        showDownload(`📥 ${filename} with ${count} items downloaded`);
      }
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    return task.status === taskFilter;
  });

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center text-white">
          <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          📋 Recent Tasks
        </h3>
        
        {/* Task Filter */}
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={taskFilter}
            onChange={(e) => onFilterChange(e.target.value as TaskFilter)}
            className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Tasks</option>
            <option value="running">🔄 Running</option>
            <option value="completed">✅ Completed</option>
            <option value="failed">❌ Failed</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="bg-slate-700/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 opacity-50" />
          </div>
          <p className="text-lg font-medium mb-2">
            {taskFilter === 'all' 
              ? 'No tasks yet' 
              : `No ${taskFilter} tasks found`
            }
          </p>
          <p className="text-sm">
            {taskFilter === 'all' 
              ? 'Start by entering a URL or search query above to begin parsing websites.' 
              : `Try selecting a different filter to see other tasks.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-custom">
          {filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-gradient-to-r from-slate-700/50 to-slate-800/30 border border-slate-600/50 rounded-xl p-5 hover:border-slate-500/50 transition-all cursor-pointer group"
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-white truncate">
                        {task.task_type === 'single_site' 
                          ? task.parameters.url 
                          : `"${task.parameters.query}"`
                        }
                      </p>
                      <span className="flex-shrink-0 text-xs bg-slate-600/50 text-slate-300 px-2 py-1 rounded-full">
                        {task.task_type === 'single_site' 
                          ? '🌐 Single' 
                          : `🚀 Batch (${task.parameters.num_results})`
                        }
                      </span>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getTaskStatusBg(task.status)}`} />
                      <span className={`text-sm font-medium capitalize ${getTaskStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">
                        {formatRelativeTime(task.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons for completed tasks */}
                {task.status === 'completed' && (
                  <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleExportTask(e, task)}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 rounded-lg transition-colors"
                      title="Export results"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                )}
                
                {/* View details button */}
                <div className="flex items-center ml-2">
                  <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
              
              {/* Error message for failed tasks */}
              {task.status === 'failed' && task.error_message && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <p className="text-red-300 text-sm">❌ {task.error_message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList; 