'use client';

import { useState } from 'react';

interface TimeOnlyPickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TimeOnlyPicker({ 
  value = '', 
  onChange, 
  placeholder = "Выберите время",
  className = ""
}: TimeOnlyPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Генерируем временные слоты с 9:00 до 18:00 с интервалом в 15 минут
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 17 && minute > 45) break; // Последний слот 17:45
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return placeholder;
    return time;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white text-left hover:bg-gray-700 transition-colors"
      >
        {formatDisplayTime(value)}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {timeSlots.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => handleTimeSelect(time)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors ${
                value === time 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      )}

      {/* Клик вне компонента для закрытия */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
