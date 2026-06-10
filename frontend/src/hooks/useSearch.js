import { useState, useEffect, useCallback, useRef } from 'react';
import { searchAPI } from '../services/api';

export function useSearch({ debounceMs = 300 } = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const debounceTimer = useRef(null);

  const doSearch = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await searchAPI.search({ q: query, ...params });
      setResults(data.data.products);
      setPagination(data.data.pagination);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Search failed');
      setResults([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [query]);

  const getSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const { data } = await searchAPI.autocomplete(q);
      setSuggestions(data.data.suggestions || []);
      return data.data;
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const debouncedGetSuggestions = useCallback((q) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => getSuggestions(q), debounceMs);
  }, [getSuggestions, debounceMs]);

  const fetchTrending = useCallback(async (params = {}) => {
    try {
      const { data } = await searchAPI.trending(params);
      setTrending(data.data.trending);
      return data.data.trending;
    } catch {
      setTrending([]);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await searchAPI.getHistory();
      setHistory(data.data.history);
      return data.data.history;
    } catch {
      setHistory([]);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await searchAPI.clearHistory();
      setHistory([]);
    } catch {}
  }, []);

  const trackClick = useCallback(async (productId, position) => {
    try {
      await searchAPI.trackClick({ query, productId, position });
    } catch {}
  }, [query]);

  const trackConversion = useCallback(async (orderId, value) => {
    try {
      await searchAPI.trackConversion({ query, orderId, value });
    } catch {}
  }, [query]);

  const voiceSearch = useCallback(async (transcript, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await searchAPI.voice({ transcript, ...params });
      setResults(data.data.products);
      setPagination(data.data.pagination);
      setQuery(transcript);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Voice search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const imageSearch = useCallback(async (imageUrl, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await searchAPI.image({ imageUrl, ...params });
      setResults(data.data.products);
      setPagination(data.data.pagination);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Image search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const semanticSearch = useCallback(async (q, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await searchAPI.semantic({ q, ...params });
      setResults(data.data.products);
      setPagination(data.data.pagination);
      setQuery(q);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Semantic search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const barcodeSearch = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await searchAPI.barcode(code);
      return data.data.product;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Barcode search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    query, setQuery,
    results, setResults,
    suggestions,
    suggestionsLoading,
    trending,
    history,
    loading,
    error,
    pagination,
    doSearch,
    getSuggestions,
    debouncedGetSuggestions,
    fetchTrending,
    fetchHistory,
    clearHistory,
    trackClick,
    trackConversion,
    voiceSearch,
    imageSearch,
    semanticSearch,
    barcodeSearch,
  };
}

export function useAutocomplete({ debounceMs = 300 } = {}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef(null);

  const fetch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }
    setLoading(true);
    try {
      const { data } = await searchAPI.autocomplete(q);
      setSuggestions(data.data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback((q) => {
    setQuery(q);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetch(q), debounceMs);
  }, [fetch, debounceMs]);

  const selectNext = useCallback(() => {
    setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
  }, [suggestions.length]);

  const selectPrev = useCallback(() => {
    setSelectedIndex(prev => Math.max(prev - 1, -1));
  }, []);

  const reset = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    query, setQuery,
    suggestions, setSuggestions,
    loading,
    selectedIndex, setSelectedIndex,
    fetch,
    debouncedFetch,
    selectNext,
    selectPrev,
    reset,
  };
}
