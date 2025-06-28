// Простые типы для всего приложения
export type Task = {
  id: string;
  task_type: 'single_site' | 'batch_parse';
  status: 'running' | 'completed' | 'failed';
  parameters: any;
  created_at: string;
  completed_at?: string;
  error_message?: string;
};

export type ParsedSite = {
  id: number;
  task_id: string;
  domain: string;
  url: string;
  title?: string;
  snippet?: string;
  status: string;
  emails?: string[];
  contact_forms?: string[];
  parsed_at: string;
  error_message?: string;
  processing_time?: number;
};

export type TaskFilter = 'all' | 'running' | 'completed' | 'failed';

export type SingleSiteRequest = {
  url: string;
  skip_sitemap?: boolean;
  use_ai_validation?: boolean;
};

export type BatchRequest = {
  query: string;
  num_results: number;
  skip_sitemap?: boolean;
  use_ai_validation?: boolean;
};

export type SingleSiteParseResponse = {
  success: boolean;
  url: string;
  task_id: string;
  message: string;
};

export type BatchParseResponse = {
  success: boolean;
  query: string;
  task_id: string;
  message: string;
  total_domains: number;
  successful_domains: number;
  total_emails: number;
  total_forms: number;
  sites: any[];
};

export type TasksSummary = {
  period_days: number;
  task_counts: Record<string, number>;
  total_sites_processed: number;
  successful_sites: number;
  success_rate: number;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
}; 