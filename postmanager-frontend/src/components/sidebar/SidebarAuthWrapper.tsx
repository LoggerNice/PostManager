'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { PAGE_URL } from '@/constants';

export default function SidebarAuthWrapper() {
    const pathname = usePathname();

    if (pathname === PAGE_URL.AUTH) {
        return null;
    }

    return <Sidebar />;
}
