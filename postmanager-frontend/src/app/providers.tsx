'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <SidebarProvider>
                {children}
            </SidebarProvider>
        </Provider>
    );
}