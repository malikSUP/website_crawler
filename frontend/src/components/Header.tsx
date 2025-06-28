import React from 'react';
import { Search, Globe, Mail, FileText, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="border-b border-slate-700 bg-gradient-to-r from-slate-800/80 via-slate-800/90 to-slate-700/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                🚀 Contact Parser Pro
              </h1>
              <p className="text-slate-300 text-sm mt-1 flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>AI-powered contact extraction from any website</span>
              </p>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/30">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">Single & Batch Processing</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/30">
              <Mail className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">Email Extraction</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/30">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300">CSV Export</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 