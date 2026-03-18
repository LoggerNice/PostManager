'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { usePathname } from 'next/navigation';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const isRoadmap = pathname === '/roadmap' || pathname.startsWith('/roadmap/');

  return (
    <main 
      className={`flex-1 transition-all duration-300 ease-in-out ${
        collapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      {isRoadmap ? (
        <div className="w-full h-[calc(100vh-0px)]">{children}</div>
      ) : (
        <div className="container mx-auto px-4 my-6">{children}</div>
      )}
    </main>
  );
} 