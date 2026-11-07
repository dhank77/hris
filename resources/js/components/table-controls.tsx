import { router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Laravel paginator serialized through Inertia. */
export type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type SortDir = 'asc' | 'desc';

/** Plain URL string or a Wayfinder route definition ({ url: string; method: string }). */
export type RouteUrl = string | { url: string; method?: string };

const resolveUrl = (url: RouteUrl): string =>
    typeof url === 'string' ? url : url.url;

const currentParams = () => new URLSearchParams(window.location.search);

/** Navigate to a table URL, merging params into the current query and resetting pagination. */
export const navigateTable = (
    url: RouteUrl,
    params: Record<string, string>,
) => {
    const search = currentParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            search.set(key, value);
        } else {
            search.delete(key);
        }
    }
    if (!('page' in params)) {
        search.delete('page');
    }

    router.get(resolveUrl(url), Object.fromEntries(search), {
        preserveState: true,
        preserveScroll: true,
    });
};

/** Read the active sort params with fallbacks to the table defaults. */
export const readSort = (
    defaultSort: string,
    defaultDir: SortDir = 'desc',
): { sort: string; dir: SortDir } => {
    const params = currentParams();
    const sort = params.get('sort') || defaultSort;
    const dir = (params.get('dir') || defaultDir) as SortDir;
    return { sort, dir };
};

export const readSearch = () => currentParams().get('search') ?? '';

export function TableSearch({
    url,
    defaultValue = '',
    placeholder = 'Cari...',
    className,
}: {
    url: RouteUrl;
    defaultValue?: string;
    placeholder?: string;
    className?: string;
}) {
    const [value, setValue] = useState(defaultValue);

    // Keep local state in sync when the search param changes externally
    // (e.g. clearing via filter change resets page to fresh data).
    useEffect(() => {
        setValue(defaultValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultValue]);

    useEffect(() => {
        if (value === defaultValue) {
            return;
        }
        const timer = setTimeout(() => {
            navigateTable(url, { search: value });
        }, 350);
        return () => clearTimeout(timer);
    }, [value, defaultValue, url]);

    return (
        <div className={cn('relative w-full sm:max-w-xs', className)}>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="pl-8"
            />
            {value && (
                <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setValue('')}
                    aria-label="Bersihkan pencarian"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

export function TablePagination<T>({
    paginator,
    url,
    className,
}: {
    paginator: Paginator<T>;
    url: RouteUrl;
    className?: string;
}) {
    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm',
                className,
            )}
        >
            <p className="text-muted-foreground">
                Halaman{' '}
                <span className="font-medium text-foreground">
                    {paginator.current_page}
                </span>{' '}
                dari {paginator.last_page} ·{' '}
                <span className="tabular">
                    {paginator.from ?? 0}–{paginator.to ?? 0} /{' '}
                    {paginator.total} data
                </span>
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page <= 1}
                    onClick={() =>
                        navigateTable(url, {
                            page: String(paginator.current_page - 1),
                        })
                    }
                >
                    <ChevronLeft aria-hidden="true" /> Sebelumnya
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page >= paginator.last_page}
                    onClick={() =>
                        navigateTable(url, {
                            page: String(paginator.current_page + 1),
                        })
                    }
                >
                    Berikutnya <ChevronRight aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

export function SortableHead({
    label,
    field,
    currentSort,
    currentDir,
    url,
    className,
}: {
    label: string;
    field: string;
    currentSort: string;
    currentDir: SortDir;
    url: RouteUrl;
    className?: string;
}) {
    const active = currentSort === field;
    const nextDir: SortDir = active && currentDir === 'asc' ? 'desc' : 'asc';

    return (
        <TableHead className={className}>
            <button
                type="button"
                className={cn(
                    'inline-flex items-center gap-1 whitespace-nowrap transition-colors',
                    active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() =>
                    navigateTable(url, { sort: field, dir: nextDir })
                }
                aria-label={`Urutkan berdasarkan ${label}`}
            >
                {label}
                {active ? (
                    currentDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    )
                ) : (
                    <ChevronsUpDown
                        className="h-3.5 w-3.5 opacity-40"
                        aria-hidden="true"
                    />
                )}
            </button>
        </TableHead>
    );
}
