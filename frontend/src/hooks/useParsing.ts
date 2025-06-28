import { useState } from 'react';
import apiService from '../services/api';
import type { SingleSiteRequest, BatchRequest } from '../types';

export const useParsing = () => {
  const [isLoading, setIsLoading] = useState(false);

  const parseSingleSite = async (request: SingleSiteRequest) => {
    setIsLoading(true);
    try {
      const response = await apiService.parseSingleSite(request);
      return response;
    } catch (error) {
      console.error('Failed to start single site parsing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const parseBatchSites = async (request: BatchRequest) => {
    setIsLoading(true);
    try {
      const response = await apiService.parseBatchSites(request);
      return response;
    } catch (error) {
      console.error('Failed to start batch parsing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    parseSingleSite,
    parseBatchSites
  };
}; 