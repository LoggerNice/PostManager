'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { PAGE_URL } from '@/constants';
import { useState } from 'react';

export default function SidebarAuthWrapper() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
    const toggleSidebar = () => setCollapsed((v) => !v);

    if (pathname === PAGE_URL.AUTH) {
        return null;
    }

    return <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />;
}
