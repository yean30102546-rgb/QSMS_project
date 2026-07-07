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
    <div className="space-y-2">
      <label className="block ml-1 text-xs font-semibold text-slate-500">{label}</label>
      <ConfigProvider
        locale={localeTh}
        theme={{
          token: {
            fontFamily: `"Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`,
            fontSize: 14,
            colorText: "#1d1d1f",
            colorTextPlaceholder: "#a1a1aa", // text-slate-400
            colorBorder: "#d2d2d7", // border-border
            borderRadius: 12, // rounded-xl
            colorPrimary: "#3b82f6", // blue-500
          },
          components: {
            DatePicker: {
              colorBgContainer: "rgba(248, 250, 252, 0.5)", // bg-slate-50/50
              controlHeight: 46, // h-[46px]
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
