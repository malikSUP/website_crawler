import React, { useState, useEffect } from 'react';
import { 
  X, Clock, CheckCircle, AlertCircle, Mail, FileText, 
  Copy, ExternalLink, Trash2, ChevronDown, ChevronRight,
  Download, FileSpreadsheet
} from 'lucide-react';
import { 
  formatDuration, copyToClipboard, 
  truncateText, exportEmailsToCSV
} from '../utils';
import type { Task, ParsedSite } from '../types';
import api from '../services/api';

interface TaskDetailsModalProps {
  task: Task;
  sites: ParsedSite[];
  onClose: () => void;
  onDelete: (taskId: string) => void;
  isLoading: boolean;
  showSuccess?: (message: string) => void;
  showDownload?: (message: string) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  sites,
  onClose,
  onDelete,
  showSuccess,
  showDownload
}) => {
  const [copiedEmails, setCopiedEmails] = useState<Set<string>>(new Set());
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

  const handleCopyEmail = async (email: string) => {
    const success = await copyToClipboard(email);
    if (success) {
      setCopiedEmails(new Set(copiedEmails).add(email));
      if (showSuccess) {
        showSuccess(`📋 ${email} copied to clipboard`);
      }
      setTimeout(() => {
        setCopiedEmails(prev => {
          const newSet = new Set(prev);
          newSet.delete(email);
          return newSet;
        });
      }, 2000);
    }
  };

  const toggleSiteExpansion = (domain: string) => {
    const newExpanded = new Set(expandedSites);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedSites(newExpanded);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      onDelete(task.id);
    }
  };

  const handleExportAll = async () => {
    try {
      await api.exportTaskToCsv(task.id);
      if (showDownload) {
        showDownload(`📥 CSV file downloaded successfully`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      if (showSuccess) {
        showSuccess('❌ Export failed');
      }
    }
  };

  const handleExportEmails = () => {
    exportEmailsToCSV(task, sites, (filename, count) => {
      if (showDownload) {
        showDownload(`📥 ${filename} with ${count} emails downloaded`);
      }
    });
  };

  const getTotalResults = () => {
    if (sites.length > 0) {
      return sites.reduce((acc, site) => ({
        emails: acc.emails + (site.emails?.length || 0),
        forms: acc.forms + (site.contact_forms?.length || 0)
      }), { emails: 0, forms: 0 });
    }
    
    return { emails: 0, forms: 0 };
  };

  const totalResults = getTotalResults();
  const hasResults = totalResults.emails > 0 || totalResults.forms > 0;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-800 rounded-lg sm:rounded-2xl border border-slate-700 shadow-2xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-3 sm:p-6 border-b border-slate-600">
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mt-1 sm:mt-0 flex-shrink-0 ${
                task.status === 'completed' ? 'bg-green-400 shadow-lg shadow-green-400/30' :
                task.status === 'running' ? 'bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/30' :
                task.status === 'failed' ? 'bg-red-400 shadow-lg shadow-red-400/30' : 'bg-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white break-words">
                  {task.task_type === 'single_site' ? '🌐 Single Site Parse' : '🚀 Batch Parse'}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm break-all mt-1">
                  {task.task_type === 'single_site' 
                    ? task.parameters.url 
                    : `"${task.parameters.query}" (${task.parameters.num_results} sites)`
                  }
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 ml-3">
              {/* Export Buttons - only show for completed tasks with results */}
              {task.status === 'completed' && hasResults && (
                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handleExportAll}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white text-xs sm:text-sm whitespace-nowrap min-h-[40px] sm:min-h-0"
                    title="Export all results to CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export All</span>
                  </button>
                  
                  {totalResults.emails > 0 && (
                    <button
                      onClick={handleExportEmails}
                      className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white text-xs sm:text-sm whitespace-nowrap min-h-[40px] sm:min-h-0"
                      title="Export emails only to CSV"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">Emails Only</span>
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                {(task.status === 'completed' || task.status === 'failed') && (
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Delete task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto h-full sm:h-auto sm:max-h-[calc(90vh-140px)] scrollbar-custom">
          {/* Enhanced Task Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-600 col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-xs sm:text-sm mb-2 font-medium">Status</div>
              <div className="flex items-center space-x-2">
                {task.status === 'completed' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                {task.status === 'running' && <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-spin" />}
                {task.status === 'failed' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />}
                <span className="text-white font-semibold capitalize text-sm sm:text-base">{task.status}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-600 col-span-2 sm:col-span-1">
              <div className="text-slate-400 text-xs sm:text-sm mb-2 font-medium">Duration</div>
              <div className="text-white font-semibold text-sm sm:text-base">
                {formatDuration(task.created_at, task.completed_at)}
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-600 col-span-2">
              <div className="text-slate-400 text-xs sm:text-sm mb-2 font-medium">Results Found</div>
              <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-3 text-sm">
                <div className="flex items-center space-x-1 text-blue-400">
                  <Mail className="w-4 h-4" />
                  <span className="font-semibold">{totalResults.emails}</span>
                  <span className="text-xs text-slate-400">emails</span>
                </div>
                <div className="flex items-center space-x-1 text-green-400">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold">{totalResults.forms}</span>
                  <span className="text-xs text-slate-400">forms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {task.status === 'completed' && sites.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-0">📊 Results</h3>
                {hasResults && (
                  <div className="text-xs sm:text-sm text-slate-400">
                    Found {totalResults.emails + totalResults.forms} total items
                  </div>
                )}
              </div>
              
              {/* Display results from sites */}
              <div className="space-y-4 sm:space-y-6">
                {/* Emails Section */}
                {sites.some(site => site.emails && site.emails.length > 0) && (
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 rounded-lg sm:rounded-xl p-3 sm:p-5">
                    <h4 className="font-semibold text-white mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                      <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      📧 Email Addresses ({totalResults.emails})
                    </h4>
                    <div className="grid gap-2 sm:gap-3">
                      {sites.map(site => 
                        site.emails?.map((email: string, index: number) => (
                          <div key={`${site.id}-${index}`} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                            <span className="text-slate-200 font-mono text-xs sm:text-sm break-all flex-1 mr-2">{email}</span>
                            <button
                              onClick={() => handleCopyEmail(email)}
                              className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              title="Copy email"
                            >
                              {copiedEmails.has(email) ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Forms Section */}
                {sites.some(site => site.contact_forms && site.contact_forms.length > 0) && (
                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30 rounded-lg sm:rounded-xl p-3 sm:p-5">
                    <h4 className="font-semibold text-white mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                      <div className="bg-green-500/20 p-2 rounded-lg mr-3">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      </div>
                        📝 Contact Forms ({totalResults.forms})
                      </h4>
                      <div className="grid gap-2 sm:gap-3">
                        {sites.map(site =>
                          site.contact_forms?.map((form: string, index: number) => (
                            <div key={`${site.id}-form-${index}`} className="flex items-center space-x-3 bg-slate-800/60 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                              <span className="text-slate-200 font-mono text-xs sm:text-sm flex-1 break-all">{form}</span>
                              <a
                                href={form.startsWith('http') ? form : `${site.url}${form}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                              </a>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                {/* No Results Message */}
                {totalResults.emails === 0 && totalResults.forms === 0 && (
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg sm:rounded-xl p-6 sm:p-8 text-center">
                    <div className="text-slate-400 text-base sm:text-lg mb-2">🔍 No Results Found</div>
                    <p className="text-slate-500 text-xs sm:text-sm">No email addresses or contact forms were found on this website.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Results */}
          {task.task_type === 'batch_parse' && sites.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-0">🌐 Parsed Websites</h4>
                <div className="text-xs sm:text-sm text-slate-400">
                  {sites.filter(site => site.status === 'success').length} / {sites.length} successful
                </div>
              </div>
              
              {sites.map((site) => (
                <div key={site.id} className="bg-gradient-to-r from-slate-700/40 to-slate-800/40 border border-slate-600/50 rounded-lg sm:rounded-xl overflow-hidden hover:border-slate-500/50 transition-all">
                  <div
                    className="flex items-center justify-between p-3 sm:p-5 cursor-pointer hover:bg-slate-600/20 transition-colors"
                    onClick={() => toggleSiteExpansion(site.domain)}
                  >
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-shrink-0 mt-1 sm:mt-0">
                        {expandedSites.has(site.domain) ? (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        )}
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full shadow-lg ${
                          site.status === 'success' 
                            ? 'bg-green-400 shadow-green-400/30' 
                            : 'bg-red-400 shadow-red-400/30'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm sm:text-lg break-words">{site.domain}</div>
                        {site.title && (
                          <div className="text-slate-300 text-xs sm:text-sm mt-1 break-words">
                            {truncateText(site.title, 60)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs sm:text-sm flex-shrink-0 ml-3">
                      <div className="flex items-center space-x-1 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        <span className="text-blue-300 font-medium">{site.emails?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <span className="text-green-300 font-medium">{site.contact_forms?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {expandedSites.has(site.domain) && (
                    <div className="px-3 sm:px-5 pb-3 sm:pb-5 border-t border-slate-600/50 bg-slate-800/30">
                      {site.status === 'success' ? (
                        <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                          {/* Site URL */}
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm">
                            <span className="text-slate-400 flex-shrink-0">🔗 URL:</span>
                            <a 
                              href={site.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline font-mono break-all"
                            >
                              {site.url}
                            </a>
                          </div>
                          
                          {/* Emails */}
                          {site.emails && site.emails.length > 0 && (
                            <div>
                              <h5 className="text-white font-medium mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                <Mail className="w-4 h-4 mr-2 text-blue-400" />
                                Emails Found ({site.emails.length})
                              </h5>
                              <div className="grid gap-2">
                                {site.emails.map((email, index) => (
                                  <div key={index} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2 border border-slate-600/30">
                                    <span className="text-slate-200 font-mono text-xs sm:text-sm break-all flex-1 mr-2">{email}</span>
                                    <button
                                      onClick={() => handleCopyEmail(email)}
                                      className="p-1 hover:bg-slate-600/50 rounded transition-colors flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                    >
                                      {copiedEmails.has(email) ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Contact Forms */}
                          {site.contact_forms && site.contact_forms.length > 0 && (
                            <div>
                              <h5 className="text-white font-medium mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                <FileText className="w-4 h-4 mr-2 text-green-400" />
                                Contact Forms Found ({site.contact_forms.length})
                              </h5>
                              <div className="grid gap-2">
                                {site.contact_forms.map((form, index) => (
                                  <div key={index} className="flex items-center space-x-2 bg-slate-700/50 rounded-lg px-3 py-2 border border-slate-600/30">
                                    <span className="text-slate-200 font-mono text-xs sm:text-sm flex-1 break-all">{form}</span>
                                    <a
                                      href={form.startsWith('http') ? form : `${site.url}${form}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-slate-600/50 rounded transition-colors flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="w-4 h-4 text-slate-400 hover:text-white" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* No results message */}
                          {(!site.emails || site.emails.length === 0) && (!site.contact_forms || site.contact_forms.length === 0) && (
                            <div className="text-slate-400 text-xs sm:text-sm text-center py-3">
                              No emails or contact forms found on this website.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-3 sm:pt-4 bg-red-500/5 border border-red-500/20 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center space-x-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium text-sm sm:text-base">Parsing Failed</span>
                          </div>
                          <p className="text-red-300 text-xs sm:text-sm mt-1 break-words">
                            {site.error_message || 'Unknown error occurred while parsing this website.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error Details */}
          {task.status === 'failed' && task.error_message && (
            <div className="mb-4 sm:mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-2">Error Details</h3>
              <p className="text-red-300 font-mono text-xs sm:text-sm break-words">{task.error_message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal; 