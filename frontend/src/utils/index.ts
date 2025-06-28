import type { Task } from '../types';
import type { ParsedSite } from '../types';

// Format duration from start to end time
export const formatDuration = (start: string, end?: string): string => {
  const startTime = new Date(start + (start.includes('Z') ? '' : 'Z')); // Add Z if not present
  const endTime = end ? new Date(end + (end.includes('Z') ? '' : 'Z')) : new Date();
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  
  if (duration < 60) {
    return `${duration}s`;
  } else if (duration < 3600) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

// Format relative time (e.g., "2 minutes ago")
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  // Ensure timestamp is treated as UTC
  const date = new Date(timestamp + (timestamp.includes('Z') ? '' : 'Z'));
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
};

// Format absolute time
export const formatAbsoluteTime = (timestamp: string): string => {
  const date = new Date(timestamp + (timestamp.includes('Z') ? '' : 'Z'));
  return date.toLocaleString();
};

// Format time for logs
export const formatLogTime = (timestamp: string): string => {
  const date = new Date(timestamp + (timestamp.includes('Z') ? '' : 'Z'));
  return date.toLocaleTimeString();
};

// Get task status color
export const getTaskStatusColor = (status: Task['status']): string => {
  switch (status) {
    case 'running':
      return 'text-yellow-500';
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
};

// Get task status background color
export const getTaskStatusBg = (status: Task['status']): string => {
  switch (status) {
    case 'running':
      return 'bg-yellow-400';
    case 'completed':
      return 'bg-green-400';
    case 'failed':
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
};

// Validate URL
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Calculate success rate
export const calculateSuccessRate = (successful: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get domain from URL
export const getDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// CSV Export utilities
export const escapeCSVField = (field: string | undefined): string => {
  if (!field) return '';
  // Escape double quotes by doubling them and wrap in quotes if contains comma, quote, or newline
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

export const convertArrayToCSV = (data: any[], headers: string[]): string => {
  const csvHeaders = headers.map(escapeCSVField).join(',');
  const csvRows = data.map(row => 
    headers.map(header => escapeCSVField(String(row[header] || ''))).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Export task results to CSV in the requested format
export const exportTaskToCSV = (task: Task, sites?: ParsedSite[], showNotification?: (filename: string, count: number) => void): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const data: any[] = [];
  
  if (task.task_type === 'single_site' && sites && sites.length > 0) {
    // Single site export using sites data
    const site = sites[0]; // Single site should have only one site entry
    const parsedDate = site.parsed_at ? new Date(site.parsed_at).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16);
    const hasContactForms = site.contact_forms && site.contact_forms.length > 0;
    
    if (site.emails && site.emails.length > 0) {
      site.emails.forEach((email: string) => {
        data.push({
          date: parsedDate,
          domain: site.domain,
          page: site.url,
          emails: email,
          form_found_page: hasContactForms ? 'True' : ''
        });
      });
    } else {
      // No emails found, but check if there are contact forms
      data.push({
        date: parsedDate,
        domain: site.domain,
        page: site.url,
        emails: '',
        form_found_page: hasContactForms ? 'True' : ''
      });
    }
    
  } else if (task.task_type === 'batch_parse' && sites) {
    // Batch export
    sites.forEach(site => {
      const parsedDate = site.parsed_at ? new Date(site.parsed_at).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16);
      const hasContactForms = site.contact_forms && site.contact_forms.length > 0;
      
      if (site.emails && site.emails.length > 0) {
        site.emails.forEach(email => {
          data.push({
            date: parsedDate,
            domain: site.domain,
            page: site.url,
            emails: email,
            form_found_page: hasContactForms ? 'True' : ''
          });
        });
      } else {
        // No emails found, but check if there are contact forms
        data.push({
          date: parsedDate,
          domain: site.domain,
          page: site.url,
          emails: '',
          form_found_page: hasContactForms ? 'True' : ''
        });
      }
    });
  }
  
  const headers = ['date', 'domain', 'page', 'emails', 'form_found_page'];
  const csvContent = convertArrayToCSV(data, headers);
  const filename = task.task_type === 'single_site' 
    ? `single_site_results_${getDomainFromUrl(task.parameters.url || '')}_${timestamp}.csv`
    : `batch_results_${task.parameters.query?.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
  
  if (showNotification) {
    showNotification(filename, data.length);
  }
};

// Export all emails from task to CSV
export const exportEmailsToCSV = (task: Task, sites?: ParsedSite[], showNotification?: (filename: string, count: number) => void): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const data: any[] = [];
  
  if (task.task_type === 'single_site' && sites && sites.length > 0) {
    const site = sites[0];
    if (site.emails) {
      site.emails.forEach((email: string) => {
        data.push({
          email,
          domain: site.domain,
          source_url: site.url,
          task_type: 'single_site',
          parsed_at: site.parsed_at
        });
      });
    }
  } else if (task.task_type === 'batch_parse' && sites) {
    sites.forEach(site => {
      if (site.emails) {
        site.emails.forEach(email => {
          data.push({
            email,
            domain: site.domain,
            source_url: site.url,
            task_type: 'batch_parse',
            parsed_at: site.parsed_at
          });
        });
      }
    });
  }
  
  const headers = ['email', 'domain', 'source_url', 'task_type', 'parsed_at'];
  const csvContent = convertArrayToCSV(data, headers);
  const filename = `emails_only_${task.task_type}_${timestamp}.csv`;
  downloadCSV(csvContent, filename);
  
  if (showNotification) {
    showNotification(filename, data.length);
  }
}; 