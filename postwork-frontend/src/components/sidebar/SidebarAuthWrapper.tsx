'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function SidebarAuthWrapper() {
    const pathname = usePathname();

    if (pathname === '/auth') {
        return null;
    }

    return <Sidebar />;
}
