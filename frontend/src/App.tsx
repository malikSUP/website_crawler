import React, { useState } from 'react';
import Header from './components/Header';
import ParsingControls from './components/ParsingControls';
import QuickStats from './components/QuickStats';
import TaskList from './components/TaskList';
import TaskDetailsModal from './components/TaskDetailsModal';
import SimpleNotifications from './components/SimpleNotifications';
import { useTasks } from './hooks/useTasks';
import { useParsing } from './hooks/useParsing';
import { useNotifications } from './hooks/useNotifications';
import type { TaskFilter, SingleSiteRequest, BatchRequest } from './types';

const App: React.FC = () => {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  
  // Используем хуки для упрощения логики
  const { 
    tasks, 
    isLoading: isTasksLoading, 
    selectedTask, 
    taskSites, 
    loadTasks, 
    handleTaskClick, 
    handleTaskDelete, 
    setSelectedTask 
  } = useTasks();
  
  const { isLoading: isParsingLoading, parseSingleSite, parseBatchSites } = useParsing();
  const { notifications, showSuccess, showError, removeNotification } = useNotifications();

  // Обработка одиночного парсинга
  const handleSingleSiteParse = async (request: SingleSiteRequest) => {
    try {
      const response = await parseSingleSite(request);
      if (response.success && response.data) {
        showSuccess(`Started parsing ${request.url}`);
        await loadTasks();
      } else {
        showError(response.error || 'Failed to start parsing');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    }
  };

  // Обработка батч парсинга
  const handleBatchParse = async (request: BatchRequest) => {
    try {
      const response = await parseBatchSites(request);
      if (response.success && response.data) {
        showSuccess(`Started parsing ${request.num_results} sites for "${request.query}"`);
        await loadTasks();
      } else {
        showError(response.error || 'Failed to start batch parsing');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    }
  };

  // Обработка удаления задачи
  const handleTaskDeleteWithNotification = async (taskId: string) => {
    const success = await handleTaskDelete(taskId);
    if (success) {
      showSuccess('Task deleted successfully');
    } else {
      showError('Failed to delete task');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Простые уведомления */}
      <SimpleNotifications 
        notifications={notifications} 
        onRemove={removeNotification} 
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <ParsingControls
              onSingleSiteParse={handleSingleSiteParse}
              onBatchParse={handleBatchParse}
              isLoading={isParsingLoading}
            />
            
            <QuickStats 
              tasks={tasks} 
              isLoading={isTasksLoading}
            />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-6">
            <TaskList
              tasks={tasks}
              taskFilter={taskFilter}
              onFilterChange={setTaskFilter}
              onTaskClick={handleTaskClick}
              isLoading={isTasksLoading}
              showDownload={showSuccess}
            />
          </div>
        </div>

        {/* Welcome Message for new users */}
        {tasks.length === 0 && !isTasksLoading && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-700/30">
              <h2 className="text-2xl font-bold mb-4 text-white">
                🎉 Welcome to Contact Parser Pro!
              </h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Start by entering a website URL or search query above to extract contact information. 
                Our AI-powered system will find email addresses and contact forms for you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-blue-400 text-lg mb-2">🌐</div>
                  <div className="font-semibold text-white mb-1">Single Site</div>
                  <div className="text-slate-400">Parse one website at a time</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-green-400 text-lg mb-2">🚀</div>
                  <div className="font-semibold text-white mb-1">Batch Processing</div>
                  <div className="text-slate-400">Search and parse multiple sites</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="text-purple-400 text-lg mb-2">📊</div>
                  <div className="font-semibold text-white mb-1">CSV Export</div>
                  <div className="text-slate-400">Download results instantly</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          sites={taskSites}
          onClose={() => setSelectedTask(null)}
          onDelete={handleTaskDeleteWithNotification}
          isLoading={false}
          showSuccess={showSuccess}
          showDownload={showSuccess}
        />
      )}
    </div>
  );
};

export default App;
