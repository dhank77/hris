import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ApprovalStop = {
    label: string;
    detail?: string | null;
    state: 'done' | 'current' | 'upcoming' | 'rejected';
};

/**
 * Persetujuan digambar seperti peta jalur: satu garis, satu stasiun per tahap.
 */
export function ApprovalLine({
    stops,
    className,
}: {
    stops: ApprovalStop[];
    className?: string;
}) {
    return (
        <ol
            className={cn(
                'grid gap-0 sm:auto-cols-fr sm:grid-flow-col',
                className,
            )}
        >
            {stops.map((stop, index) => {
                const isLast = index === stops.length - 1;
                const passed = stop.state === 'done';

                return (
                    <li
                        key={stop.label}
                        className="relative flex gap-3 pb-5 sm:flex-col sm:gap-2 sm:pb-0"
                        aria-current={
                            stop.state === 'current' ? 'step' : undefined
                        }
                    >
                        {!isLast && (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'absolute top-6 left-[11px] h-[calc(100%-1.25rem)] w-1 rounded-full sm:top-[10px] sm:left-6 sm:h-1 sm:w-[calc(100%-1.5rem)]',
                                    passed ? 'bg-success' : 'bg-border',
                                )}
                            />
                        )}
                        <span
                            className={cn(
                                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-[3px] bg-card',
                                stop.state === 'done' &&
                                    'border-success bg-success text-success-foreground',
                                stop.state === 'current' &&
                                    'border-warning bg-card',
                                stop.state === 'upcoming' && 'border-border',
                                stop.state === 'rejected' &&
                                    'border-destructive bg-destructive text-destructive-foreground',
                            )}
                        >
                            {stop.state === 'done' && (
                                <Check className="size-3" strokeWidth={3.5} />
                            )}
                            {stop.state === 'rejected' && (
                                <X className="size-3" strokeWidth={3.5} />
                            )}
                        </span>
                        <span className="grid min-w-0 gap-0.5 text-sm">
                            <span
                                className={cn(
                                    'font-semibold',
                                    stop.state === 'upcoming' &&
                                        'text-muted-foreground',
                                )}
                            >
                                {stop.label}
                            </span>
                            {stop.detail && (
                                <span className="tabular text-xs text-muted-foreground">
                                    {stop.detail}
                                </span>
                            )}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
