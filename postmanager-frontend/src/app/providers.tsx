'use client';

import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store/store';
import { ToastProvider } from '@/contexts/ToastContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <ToastProvider>
                <SidebarProvider>
                    {children}
                    <Toaster position="bottom-right" />
                </SidebarProvider>
            </ToastProvider>
        </Provider>
    );
}