import { Link } from '@inertiajs/react';
import { LayoutGrid, Users, Clock, FileText, Wallet } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import { Newspaper } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as employeeIndex } from '@/routes/employees';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as leaveIndex } from '@/routes/leave-requests';
import { index as cashIndex } from '@/routes/cash-advances';
import { index as newsIndex } from '@/routes/news';
import type { NavItem } from '@/types';

export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Data Pegawai',
        href: employeeIndex(),
        icon: Users,
    },
    {
        title: 'Absensi',
        href: attendanceIndex(),
        icon: Clock,
    },
    {
        title: 'Izin/Cuti',
        href: leaveIndex(),
        icon: FileText,
    },
    {
        title: 'Kasbon',
        href: cashIndex(),
        icon: Wallet,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const isAdmin = auth?.user?.role === 'admin';

    const items: NavItem[] = isAdmin
        ? [
              ...mainNavItems,
              {
                  title: 'Berita Kepegawaian',
                  href: newsIndex(),
                  icon: Newspaper,
              },
          ]
        : mainNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
