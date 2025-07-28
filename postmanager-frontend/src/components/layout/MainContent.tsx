'use client';

import { useSidebar } from '@/contexts/SidebarContext';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { collapsed } = useSidebar();

  return (
    <main 
      className={`flex-1 transition-all duration-300 ease-in-out ${
        collapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      <div className="container mx-auto px-4 my-6">
        {children}
      </div>
    </main>
  );
} 