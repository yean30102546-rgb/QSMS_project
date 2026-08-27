"use client";

import React, { useMemo } from "react";
import { DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localeTh from "antd/locale/th_TH";
import "dayjs/locale/th";

// Set dayjs locale to Thai globally
dayjs.locale("th");
dayjs.extend(customParseFormat);

interface RecentDatePickerProps {
  value: string; // Format: DD/MM/YYYY
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}

export function RecentDatePicker({
  value,
  onChange,
  disabled,
  label
}: RecentDatePickerProps) {
  const dayjsValue = useMemo(() => {
    return value ? dayjs(value, "DD/MM/YYYY") : null;
  }, [value]);

  const handleAntdChange = (date: dayjs.Dayjs | null) => {
    if (!date) {
      onChange("");
    } else {
      onChange(date.format("DD/MM/YYYY"));
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">{label}</label>
      <ConfigProvider
        locale={localeTh}
        theme={{
          token: {
            fontFamily: `"Prompt", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
            fontSize: 14,
            colorText: "#0f172a",
            colorTextPlaceholder: "#94a3b8", // text-slate-400
            colorBorder: "#cbd5e1", // border-slate-300
            borderRadius: 6, // rounded-md
            colorPrimary: "#ecc542", // jasmine-500
          },
          components: {
            DatePicker: {
              colorBgContainer: "#ffffff",
              controlHeight: 42,
            }
          }
        }}
      >
        <DatePicker
          value={dayjsValue}
          onChange={handleAntdChange}
          disabled={disabled}
          format="DD/MM/YYYY"
          placeholder="เลือกวันที่..."
          className="w-full text-sm font-medium"
        />
      </ConfigProvider>
    </div>
  );
}
