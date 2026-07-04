import React from 'react';
import { CaretLeft, CaretRight, Calendar } from '@phosphor-icons/react';

interface DateSelectorProps {
  date: string;
  onChange: (date: string) => void;
  dayTotal?: number;
}

function DateSelector({ date, onChange, dayTotal = 0 }: DateSelectorProps) {
  // Format date display
  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[d.getDay()];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日 ${weekday}`;
  };

  // Change date
  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(newDate);
  };

  // Check if today
  const isToday = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return date === todayStr;
  };

  return (
    <div className="date-selector">
      <button className="date-nav-btn" onClick={() => changeDate(-1)} aria-label="前一天">
        <CaretLeft size={20} weight="bold" />
      </button>
      <div className="date-center">
        <span className="current-date" onClick={() => {
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          onChange(todayStr);
        }}>
          <Calendar size={16} weight="duotone" style={{ color: 'var(--color-text-secondary)' }} />
          {formatDisplayDate(date)}
          {isToday() && <span className="today-tag">今天</span>}
        </span>
        <span className="date-total">¥{dayTotal.toFixed(2)}</span>
      </div>
      <button className="date-nav-btn" onClick={() => changeDate(1)} aria-label="后一天">
        <CaretRight size={20} weight="bold" />
      </button>
    </div>
  );
}

export default DateSelector;
