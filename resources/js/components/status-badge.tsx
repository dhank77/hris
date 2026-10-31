import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClass: Record<Tone, string> = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning-foreground',
    danger: 'bg-danger-soft text-destructive',
    info: 'bg-info-soft text-info',
    neutral: 'bg-muted text-muted-foreground',
};

const dotClass: Record<Tone, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    info: 'bg-info',
    neutral: 'bg-muted-foreground',
};

const statusMap: Record<string, { label: string; tone: Tone }> = {
    pending: { label: 'Menunggu', tone: 'warning' },
    approved: { label: 'Disetujui', tone: 'success' },
    approved_level1: { label: 'Disetujui atasan', tone: 'info' },
    approved_finance: { label: 'Disetujui finance', tone: 'info' },
    disbursed: { label: 'Dicairkan', tone: 'success' },
    completed: { label: 'Lunas', tone: 'success' },
    rejected: { label: 'Ditolak', tone: 'danger' },
    present: { label: 'Hadir', tone: 'success' },
    late: { label: 'Terlambat', tone: 'warning' },
    absent: { label: 'Alpa', tone: 'danger' },
    leave: { label: 'Cuti', tone: 'info' },
    sick: { label: 'Sakit', tone: 'info' },
    permission: { label: 'Izin', tone: 'info' },
    paid: { label: 'Lunas', tone: 'success' },
    unpaid: { label: 'Belum', tone: 'neutral' },
};

export function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const { label, tone } = statusMap[status] ?? {
        label: status,
        tone: 'neutral' as Tone,
    };

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
                toneClass[tone],
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={cn('size-1.5 rounded-full', dotClass[tone])}
            />
            {label}
        </span>
    );
}
