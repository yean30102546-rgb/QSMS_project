"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface ComboboxOption {
  label: string;
  value: string;
  group?: string;
}

interface ComboboxProps {
  options: (string | ComboboxOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "เลือกรายการ...",
  emptyText = "ไม่พบข้อมูล",
  className,
  searchPlaceholder = "ค้นหา...",
  showSearch,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const normalizedOptions = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchQuery]);

  const groupedOptions = React.useMemo(() => {
    const groups: { [key: string]: ComboboxOption[] } = {};
    const flat: ComboboxOption[] = [];

    filteredOptions.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        flat.push(opt);
      }
    });

    return { groups, flat };
  }, [filteredOptions]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const shouldShowSearch = showSearch !== undefined ? showSearch : normalizedOptions.length > 5;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold transition-all text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left active:scale-[0.99]",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-slate-400 font-normal")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-55 text-slate-500" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xl z-[10000] focus:outline-none"
        align="start"
      >
        {shouldShowSearch && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 mb-1">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-800 placeholder:text-slate-400 p-0 focus:ring-0 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <div className="max-h-[220px] overflow-y-auto space-y-0.5 scrollbar-thin">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs font-bold text-slate-400">
              {emptyText}
            </div>
          ) : (
            <>
              {Object.entries(groupedOptions.groups).map(([groupName, items]) => (
                <div key={groupName} className="space-y-0.5">
                  <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50 rounded-md">
                    {groupName}
                  </div>
                  {items.map((option) => {
                    const isSelected = value === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-6 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all text-left",
                          isSelected && "bg-blue-50 text-blue-600 hover:bg-blue-100/70 hover:text-blue-700"
                        )}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-blue-600 stroke-[3px]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
              
              {groupedOptions.flat.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all text-left",
                      isSelected && "bg-blue-50 text-blue-600 hover:bg-blue-100/70 hover:text-blue-700"
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-blue-600 stroke-[3px]" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
