'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { TaskModalProvider } from '@/contexts/TaskModalContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <SidebarProvider>
                <WebSocketProvider>
                    <NotificationProvider>
                        <TaskModalProvider>
                            {children}
                        </TaskModalProvider>
                    </NotificationProvider>
                </WebSocketProvider>
            </SidebarProvider>
        </Provider>
    );
}