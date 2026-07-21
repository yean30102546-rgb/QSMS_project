import { useEffect, useMemo, useState } from 'react';

import type { ReworkCase } from '../services/api';
import { filterCasesByMultipleCriteria } from '../utils/helpers';

const ITEMS_PER_PAGE = 10;
type CaseStatus = ReworkCase['status'];
type FilterType = 'status' | 'source' | 'reason' | 'responsible' | 'date';

export function useOverallFilters(cases: ReworkCase[], searchQuery: string) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CaseStatus[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    cases.forEach((caseItem) => {
      const trimmedSource = String(caseItem.source || '').trim();
      if (trimmedSource) sources.add(trimmedSource);
    });
    return Array.from(sources).sort();
  }, [cases]);

  const uniqueReasons = useMemo(() => {
    const reasons = new Set<string>();
    cases.forEach((caseItem) => {
      caseItem.items?.forEach((item) => {
        const trimmedReason = String(item.reason || '').trim();
        if (trimmedReason) reasons.add(trimmedReason);
      });
    });
    return Array.from(reasons).sort();
  }, [cases]);

  const uniqueResponsible = useMemo(() => {
    const responsible = new Set<string>();
    cases.forEach((caseItem) => {
      caseItem.items?.forEach((item) => {
        const trimmedResponsible = String(item.responsible || '').trim();
        if (trimmedResponsible) responsible.add(trimmedResponsible);
      });
    });
    return Array.from(responsible).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    return filterCasesByMultipleCriteria(cases, {
      status: statusFilter.length > 0 ? statusFilter : undefined,
      source: sourceFilter.length > 0 ? sourceFilter : undefined,
      reason: reasonFilter.length > 0 ? reasonFilter : undefined,
      responsible: responsibleFilter.length > 0 ? responsibleFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      query: searchQuery || undefined,
    });
  }, [cases, dateFromFilter, dateToFilter, reasonFilter, responsibleFilter, searchQuery, sourceFilter, statusFilter]);

  const hasActiveFilters = statusFilter.length > 0
    || sourceFilter.length > 0
    || reasonFilter.length > 0
    || responsibleFilter.length > 0
    || Boolean(dateFromFilter || dateToFilter);

  const activeFilterCount = [statusFilter, sourceFilter, reasonFilter, responsibleFilter]
    .filter((filter) => filter.length > 0).length + (dateFromFilter || dateToFilter ? 1 : 0);

  const statusCounts = useMemo<Record<CaseStatus, number>>(() => ({
    Pending: cases.filter((caseItem) => caseItem.status === 'Pending').length,
    'In-Progress': cases.filter((caseItem) => caseItem.status === 'In-Progress').length,
    Completed: cases.filter((caseItem) => caseItem.status === 'Completed').length,
  }), [cases]);

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter.length, sourceFilter.length, reasonFilter.length, responsibleFilter.length, dateFromFilter, dateToFilter]);

  const removeFilter = (type: FilterType, value?: string) => {
    switch (type) {
      case 'status':
        setStatusFilter((prev) => value ? prev.filter((status) => status !== value) : []);
        break;
      case 'source':
        setSourceFilter((prev) => value ? prev.filter((source) => source !== value) : []);
        break;
      case 'reason':
        setReasonFilter((prev) => value ? prev.filter((reason) => reason !== value) : []);
        break;
      case 'responsible':
        setResponsibleFilter((prev) => value ? prev.filter((responsible) => responsible !== value) : []);
        break;
      case 'date':
        setDateFromFilter('');
        setDateToFilter('');
        break;
    }
  };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setSourceFilter([]);
    setReasonFilter([]);
    setResponsibleFilter([]);
    setDateFromFilter('');
    setDateToFilter('');
  };

  const toggleStatusFilter = (status: CaseStatus) => {
    setStatusFilter((prev) => (
      prev.includes(status)
        ? prev.filter((selectedStatus) => selectedStatus !== status)
        : [...prev, status]
    ));
  };

  return {
    activeFilterCount,
    clearAllFilters,
    currentPage,
    dateFromFilter,
    dateToFilter,
    filteredCases,
    hasActiveFilters,
    itemsPerPage: ITEMS_PER_PAGE,
    paginatedCases,
    reasonFilter,
    removeFilter,
    responsibleFilter,
    setCurrentPage,
    setDateFromFilter,
    setDateToFilter,
    setReasonFilter,
    setResponsibleFilter,
    setShowFilters,
    setSourceFilter,
    setStatusFilter,
    showFilters,
    sourceFilter,
    statusCounts,
    statusFilter,
    toggleStatusFilter,
    totalPages,
    uniqueReasons,
    uniqueResponsible,
    uniqueSources,
  };
}
