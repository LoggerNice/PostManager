// Утилита для воспроизведения звуковых уведомлений
class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isInitialized = false;

  constructor() {
    // Инициализируем звуки только на клиенте
    if (typeof window !== 'undefined') {
      this.preloadSounds();
      this.isInitialized = true;
    }
  }

  private preloadSounds() {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    // Звук для появления задачи в столбце "В процессе"
    const createTaskSound = new Audio('/meet-message-sound-1.mp3');
    createTaskSound.preload = 'auto';
    this.sounds.set('task_created', createTaskSound);

    // Звук для перемещения в столбцы "Согласование" и "Выполнено"
    const moveTaskSound = new Audio('/cena_notification.mp3');
    moveTaskSound.preload = 'auto';
    this.sounds.set('task_moved', moveTaskSound);
  }

  playSound(soundType: 'task_created' | 'task_moved') {
    // Проверяем, что мы на клиенте и звуки инициализированы
    if (typeof window === 'undefined' || !this.isInitialized) return;

    const sound = this.sounds.get(soundType);
    if (sound) {
      // Сбрасываем время воспроизведения на начало
      sound.currentTime = 0;
      // Воспроизводим звук
      sound.play().catch(error => {
        console.warn('Не удалось воспроизвести звук:', error);
      });
    }
  }

  // Метод для инициализации звуков на клиенте
  private ensureInitialized() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.preloadSounds();
      this.isInitialized = true;
    }
  }

  // Метод для воспроизведения звука появления задачи в столбце "В процессе"
  playTaskCreatedSound() {
    this.ensureInitialized();
    this.playSound('task_created');
  }

  // Метод для воспроизведения звука перемещения задачи в столбцы "Согласование" и "Выполнено"
  playTaskMovedSound() {
    this.ensureInitialized();
    this.playSound('task_moved');
  }
}

// Создаем единственный экземпляр SoundManager
export const soundManager = new SoundManager(); 