import { Link, usePage } from '@inertiajs/react';
import { Newspaper } from 'lucide-react';
import { mainNavItems } from '@/components/app-sidebar';
import { index as newsIndex } from '@/routes/news';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

export function MobileNav() {
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const isAdmin = auth?.user?.role === 'admin';

    const items = isAdmin
        ? [
              ...mainNavItems,
              {
                  title: 'Berita',
                  href: newsIndex(),
                  icon: Newspaper,
              },
          ]
        : mainNavItems;

    return (
        <nav
            aria-label="Menu utama"
            className="fixed inset-x-0 bottom-0 z-40 grid border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
            {items.map((item) => {
                const active = isCurrentUrl(item.href);

                return (
                    <Link
                        key={item.title}
                        href={item.href}
                        prefetch
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold',
                            active
                                ? 'text-sidebar-primary'
                                : 'text-sidebar-foreground/75',
                        )}
                    >
                        {item.icon && <item.icon className="size-5" />}
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
}
