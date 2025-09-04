'use client';

import { useEffect, useState } from 'react';

interface FireworksEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export default function FireworksEffect({ isActive, onComplete }: FireworksEffectProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
  }>>([]);

  useEffect(() => {
    if (!isActive) return;

    // Создаем частицы фейерверка
    const newParticles = [];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
    
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100
      });
    }

    setParticles(newParticles);

    // Анимация частиц
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // гравитация
          life: particle.life - 2
        })).filter(particle => particle.life > 0);

        if (updated.length === 0) {
          clearInterval(interval);
          onComplete?.();
        }

        return updated;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            opacity: particle.life / 100,
            transform: `scale(${particle.life / 100})`,
            transition: 'all 0.016s linear'
          }}
        />
      ))}
    </div>
  );
}
