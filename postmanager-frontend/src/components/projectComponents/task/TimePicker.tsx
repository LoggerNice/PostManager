'use client';

import DatePicker from '@/components/ui/DatePicker';

interface TimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeSelect: (date: Date) => void;
  currentDeadline?: Date | null;
}

export default function TimePicker({ isOpen, onClose, onTimeSelect, currentDeadline }: TimePickerProps) {
  return (
    <DatePicker
      isOpen={isOpen}
      onClose={onClose}
      onDateSelect={onTimeSelect}
      selectedDate={currentDeadline}
      showTimeSelect={true}
      minDate={new Date()}
      placeholder="Выберите дату и время"
    />
  );
} 