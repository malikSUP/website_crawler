import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import type { Task, ParsedSite } from '../types';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSites, setTaskSites] = useState<ParsedSite[]>([]);

  // Загрузка задач
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.listTasks({ limit: 50 });
      if (response.success && response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загрузка при первом рендере
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Простое поллинг без сложной логики
  useEffect(() => {
    const hasRunningTasks = tasks.some(task => task.status === 'running');
    
    if (!hasRunningTasks) return;

    const interval = setInterval(() => {
      loadTasks();
    }, 5000); // Каждые 5 секунд

    return () => clearInterval(interval);
  }, [tasks, loadTasks]);

  // Обработка клика по задаче - без кэширования
  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    
    if (task.task_type === 'batch_parse') {
      try {
        const sitesResponse = await apiService.getTaskSites(task.id);
        if (sitesResponse.success && sitesResponse.data) {
          setTaskSites(sitesResponse.data);
        }
      } catch (error) {
        console.error('Failed to load task sites:', error);
        setTaskSites([]);
      }
    } else {
      setTaskSites([]);
    }
  };

  // Удаление задачи
  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await apiService.deleteTask(taskId);
      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setSelectedTask(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    selectedTask,
    taskSites,
    loadTasks,
    handleTaskClick,
    handleTaskDelete,
    setSelectedTask
  };
}; 