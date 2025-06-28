import type { 
  Task, 
  ParsedSite, 
  TasksSummary,
  SingleSiteRequest, 
  BatchRequest,
  SingleSiteParseResponse,
  BatchParseResponse,
  ApiResponse 
} from '../types';

import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Single site parsing
  async parseSingleSite(request: SingleSiteRequest): Promise<ApiResponse<SingleSiteParseResponse>> {
    return this.request('/api/parse/single', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Batch parsing
  async parseBatchSites(request: BatchRequest): Promise<ApiResponse<BatchParseResponse>> {
    return this.request('/api/parse/batch', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Get task status
  async getTaskStatus(taskId: string): Promise<ApiResponse<Task>> {
    return this.request(`/api/task/${taskId}/status`);
  }

  // List tasks
  async listTasks(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ApiResponse<Task[]>> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return this.request(`/api/tasks${queryString ? `?${queryString}` : ''}`);
  }

  // Get task sites
  async getTaskSites(taskId: string): Promise<ApiResponse<ParsedSite[]>> {
    return this.request(`/api/task/${taskId}/sites`);
  }

  // Get tasks summary
  async getTasksSummary(days: number = 7): Promise<ApiResponse<TasksSummary>> {
    return this.request(`/api/stats/summary?days=${days}`);
  }

  // Delete task
  async deleteTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/task/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Export task to CSV
  async exportTaskToCsv(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task/${taskId}/export/csv`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'task_results.csv';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches) {
          filename = matches[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }

  // Cleanup old tasks
  async cleanupOldTasks(days: number = 30): Promise<ApiResponse<{ deleted_count: number; message: string }>> {
    return this.request('/api/admin/cleanup', {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }
}

export default new ApiService(); 