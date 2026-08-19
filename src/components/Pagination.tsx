/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  totalItems: number;
  itemsPerPage?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propTotalPages,
  totalItems,
  itemsPerPage,
  pageSize,
  onPageChange,
  onItemsPerPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'items',
  itemLabel,
  className = ''
}) => {
  const effectivePerPage = pageSize || itemsPerPage || 10;
  const effectiveTotalPages = propTotalPages || Math.ceil(totalItems / effectivePerPage) || 1;
  const effectiveItemName = itemLabel || itemName;
  const effectiveOnSizeChange = onPageSizeChange || onItemsPerPageChange;

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * effectivePerPage + 1;
  const endItem = Math.min(currentPage * effectivePerPage, totalItems);

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (effectiveTotalPages <= 7) {
      for (let i = 1; i <= effectiveTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(effectiveTotalPages);
      } else if (currentPage >= effectiveTotalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = effectiveTotalPages - 4; i <= effectiveTotalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(effectiveTotalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3.5 pt-4 pb-2 border-t border-brand-green-600/10 text-xs text-brand-green-800 ${className}`}>
      {/* Left: Summary & Per Page Dropdown */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="text-brand-green-700 font-medium">
          Showing <span className="font-bold text-brand-green-950 font-mono">{startItem}–{endItem}</span> of <span className="font-bold text-brand-green-950 font-mono">{totalItems}</span> {effectiveItemName}
        </div>

        {effectiveOnSizeChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-brand-green-600/70 hidden sm:inline">Per page:</span>
            <select
              value={effectivePerPage}
              onChange={(e) => effectiveOnSizeChange(Number(e.target.value))}
              className="bg-white border border-brand-green-200/80 rounded-lg px-2 py-1 text-xs font-semibold text-brand-green-900 focus:outline-none focus:border-brand-green-700 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {effectiveTotalPages > 1 && (
        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto py-1">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="First page"
            className="p-1.5 rounded-lg border border-brand-green-200/60 bg-white text-brand-green-800 hover:bg-brand-green-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
            className="px-2.5 py-1.5 rounded-lg border border-brand-green-200/60 bg-white text-brand-green-800 hover:bg-brand-green-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Prev</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-brand-green-600/40 font-mono text-xs">
                    …
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center font-mono ${
                    isActive
                      ? 'bg-brand-green-800 text-brand-cream-50 border border-brand-green-900 shadow-xs'
                      : 'bg-white text-brand-green-800 border border-brand-green-200/60 hover:bg-brand-green-50 hover:border-brand-green-400'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === effectiveTotalPages}
            title="Next page"
            className="px-2.5 py-1.5 rounded-lg border border-brand-green-200/60 bg-white text-brand-green-800 hover:bg-brand-green-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-2xs font-semibold"
          >
            <span className="hidden md:inline text-[11px]">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(effectiveTotalPages)}
            disabled={currentPage === effectiveTotalPages}
            title="Last page"
            className="p-1.5 rounded-lg border border-brand-green-200/60 bg-white text-brand-green-800 hover:bg-brand-green-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
