import React, { useState } from 'react';
import { Globe, Database, Play, Users } from 'lucide-react';
import { isValidUrl } from '../utils';
import type { SingleSiteRequest, BatchRequest } from '../types';

interface ParsingControlsProps {
  onSingleSiteParse: (request: SingleSiteRequest) => void;
  onBatchParse: (request: BatchRequest) => void;
  isLoading: boolean;
}

const ParsingControls: React.FC<ParsingControlsProps> = ({
  onSingleSiteParse,
  onBatchParse,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [singleUrl, setSingleUrl] = useState<string>('');
  const [batchQuery, setBatchQuery] = useState<string>('');
  const [numResults, setNumResults] = useState<number>(5);
  const [skipSitemap, setSkipSitemap] = useState<boolean>(false);
  const [batchSkipSitemap, setBatchSkipSitemap] = useState<boolean>(false);
  const [useAiValidation, setUseAiValidation] = useState<boolean>(true);

  const handleSingleSiteParse = (): void => {
    if (!singleUrl || !isValidUrl(singleUrl)) return;
    
    onSingleSiteParse({
      url: singleUrl,
      skip_sitemap: skipSitemap,
      use_ai_validation: useAiValidation
    });
  };

  const handleBatchParse = (): void => {
    if (!batchQuery.trim()) return;
    
    onBatchParse({
      query: batchQuery.trim(),
      num_results: numResults,
      skip_sitemap: batchSkipSitemap,
      use_ai_validation: useAiValidation
    });
  };

  return (
    <div className="card p-6">
      {/* Mode Selection */}
      <div className="flex space-x-1 bg-slate-700/50 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'single'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Single Site
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === 'batch'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
          }`}
        >
          <Database className="w-4 h-4 inline mr-2" />
          Batch Parse
        </button>
      </div>

      {/* Form Content */}
      {activeTab === 'single' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://example.com"
              className="input"
              disabled={isLoading}
            />
            {singleUrl && !isValidUrl(singleUrl) && (
              <p className="text-red-400 text-sm mt-1">Please enter a valid URL</p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="skipSitemap"
              checked={skipSitemap}
              onChange={(e) => setSkipSitemap(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="skipSitemap" className="text-sm text-slate-300">
              Skip sitemap parsing (faster processing)
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="singleUseAiValidation"
              checked={useAiValidation}
              onChange={(e) => setUseAiValidation(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="singleUseAiValidation" className="text-sm text-slate-300">
              Use AI for form validation
            </label>
          </div>
          
          <button
            onClick={handleSingleSiteParse}
            disabled={!singleUrl || !isValidUrl(singleUrl) || isLoading}
            className="w-full btn btn-primary transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{isLoading ? 'Starting...' : 'Start Parsing'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={batchQuery}
              onChange={(e) => setBatchQuery(e.target.value)}
              placeholder="restaurants in New York"
              className="input"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Results (1-10)
            </label>
            <select
              value={numResults}
              onChange={(e) => setNumResults(Number(e.target.value))}
              className="select"
              disabled={isLoading}
            >
              {Array.from({length: 10}, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} site{num !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          
                     <div className="flex items-center space-x-3">
             <input
               type="checkbox"
               id="batchSkipSitemap"
               checked={batchSkipSitemap}
               onChange={(e) => setBatchSkipSitemap(e.target.checked)}
               className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
               disabled={isLoading}
             />
             <label htmlFor="batchSkipSitemap" className="text-sm text-slate-300">
               Skip sitemap parsing (faster processing)
             </label>
           </div>
           
           <div className="flex items-center space-x-3">
             <input
               type="checkbox"
               id="batchUseAiValidation"
               checked={useAiValidation}
               onChange={(e) => setUseAiValidation(e.target.checked)}
               className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
               disabled={isLoading}
             />
             <label htmlFor="batchUseAiValidation" className="text-sm text-slate-300">
               Use AI for form validation
             </label>
           </div>
          
          <button
            onClick={handleBatchParse}
            disabled={!batchQuery.trim() || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>{isLoading ? 'Starting...' : 'Start Batch Parse'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ParsingControls; 