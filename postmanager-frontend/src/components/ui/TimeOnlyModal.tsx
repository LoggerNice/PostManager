'use client';

import { useState } from 'react';

interface TimeOnlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  currentTime?: string;
}

export default function TimeOnlyModal({ 
  isOpen, 
  onClose, 
  onTimeSelect, 
  currentTime = '' 
}: TimeOnlyModalProps) {
  const [selectedTime, setSelectedTime] = useState(currentTime);

  // Генерируем временные слоты с 9:00 до 18:00 с интервалом в 15 минут
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 18 && minute > 0) break; 
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (selectedTime) {
      onTimeSelect(selectedTime);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedTime(currentTime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-transparent flex items-center justify-center z-[9999]" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Выберите время</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-3 gap-2 pr-1">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTime === time 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTime}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
