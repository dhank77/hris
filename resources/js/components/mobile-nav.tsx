import { Link } from '@inertiajs/react';
import { mainNavItems } from '@/components/app-sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

export function MobileNav() {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <nav
            aria-label="Menu utama"
            className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            {mainNavItems.map((item) => {
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
