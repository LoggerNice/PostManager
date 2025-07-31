'use client';

import { ru } from 'date-fns/locale';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Кастомные стили для DatePicker
const datePickerStyles = `
  .react-datepicker {
    background-color: #1f2937 !important;
    border: 1px solid #374151 !important;
    border-radius: 12px !important;
    font-family: inherit !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  }
  
  .react-datepicker__header {
    background-color: #111827 !important;
    border-bottom: 1px solid #374151 !important;
    border-radius: 12px 12px 0 0 !important;
    padding: 16px !important;
  }
  
  .react-datepicker__current-month {
    color: #f9fafb !important;
    font-weight: 600 !important;
    font-size: 16px !important;
  }
  
  .react-datepicker__day-name {
    color: #9ca3af !important;
    font-weight: 500 !important;
    font-size: 12px !important;
    margin-top: 10px !important;
  }

  .react-datepicker-time__header {
    color: #f9fafb !important;
    font-weight: 600 !important;
    font-size: 16px !important;
  }
  
  .react-datepicker__day {
    color: #f9fafb !important;
    border-radius: 6px !important;
    width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    margin: 2px !important;
    font-size: 14px !important;
  }
  
  .react-datepicker__day:hover {
    background-color: #3b82f6 !important;
    color: white !important;
    transform: scale(1.1) !important;
    transition: all 0.2s ease !important;
  }
  
  .react-datepicker__day--selected {
    background-color: #3b82f6 !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__day--keyboard-selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }
  
  .react-datepicker__day--today {
    background-color: #1e40af !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__navigation {
    color: #f9fafb !important;
    border-radius: 6px !important;
    width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    margin-top: 10px !important;
    padding-top: 10px !important;
  }
  
  .react-datepicker__navigation:hover {
    background-color: #374151 !important;
    border-radius: 6px !important;
  }
  
  .react-datepicker__time-container {
    background-color: #1f2937 !important;
    border-left: 1px solid #374151 !important;
    border-radius: 0 12px 12px 0 !important;
  }
  
  .react-datepicker__time {
    background-color: #1f2937 !important;
    border-radius: 0 12px 12px 0 !important;
  }
  
  .react-datepicker__time-list-item {
    color: #f9fafb !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
    border-radius: 4px !important;
    margin: 2px 4px !important;
  }
  
  .react-datepicker__time-list-item:hover {
    background-color: #3b82f6 !important;
    color: white !important;
  }
  
  .react-datepicker__time-list-item--selected {
    background-color: #3b82f6 !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__month-container {
    background-color: #1f2937 !important;
  }
  
  .react-datepicker__month {
    background-color: #1f2937 !important;
    padding: 8px !important;
  }
  
  .react-datepicker__day--outside-month {
    color: #6b7280 !important;
  }
  
  .react-datepicker__day--disabled {
    color: #4b5563 !important;
  }
  
  .react-datepicker__time-caption {
    color: #9ca3af !important;
    font-weight: 500 !important;
    font-size: 12px !important;
    padding: 8px 12px !important;
  }
`;

export interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date | null;
  showTimeSelect?: boolean;
  minDate?: Date;
  placeholder?: string;
}

export default function DatePicker({ 
  isOpen, 
  onClose, 
  onDateSelect, 
  selectedDate = new Date(),
  showTimeSelect = true,
  minDate = new Date(),
  placeholder = "Выберите дату и время"
}: DatePickerProps) {
  // Используем selectedDate напрямую, без локального состояния
  const currentDate = selectedDate || new Date();

  const handleDateChange = (date: Date | null) => {
    if (date) {
      onDateSelect(date);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onClose}>
      <style>{datePickerStyles}</style>
      <div onClick={e => e.stopPropagation()}>
        <ReactDatePicker
          selected={currentDate}
          onChange={handleDateChange}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={showTimeSelect ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy"}
          locale={ru}
          inline
          minDate={minDate}
          timeCaption="Время"
          placeholderText={placeholder}
        />
      </div>
    </div>
  );
} 