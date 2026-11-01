import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Clock, FileText, Wallet } from 'lucide-react';
import { ApprovalLine } from '@/components/approval-line';
import type { ApprovalStop } from '@/components/approval-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as cashIndex, show as cashShow } from '@/routes/cash-advances';
import { create as leaveCreate, index as leaveIndex } from '@/routes/leave-requests';

type Overview = {
    totalEmployees: number;
    presentToday: number;
    lateToday: number;
    onLeaveToday: number;
    pendingCashAdvanceCount: number;
    outstandingCashAdvance: number;
};

type Props = {
    overview: Overview | null;
    today: {
        date: string;
        clock_in_at: string | null;
        clock_out_at: string | null;
        status: string | null;
    };
    monthRecap: { present: number; late: number; absent: number; leave: number };
    pendingLeaveCount: number;
    kasbon: {
        limit: number;
        remaining: number;
        active: {
            id: number;
            amount: number;
            status: string;
            approved_level1_at: string | null;
            approved_finance_at: string | null;
            disbursed_at: string | null;
        } | null;
        next_installment: { due_date: string; amount: number } | null;
    };
};

const rupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

const formatTime = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '--:--';

const formatDate = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleDateString('id-ID', options);

function kasbonStops(active: NonNullable<Props['kasbon']['active']>): ApprovalStop[] {
    const rejected = active.status === 'rejected';
    const reached = {
        level1: !!active.approved_level1_at,
        finance: !!active.approved_finance_at,
        disbursed: !!active.disbursed_at,
    };
    const stage = (done: boolean, previousDone: boolean): ApprovalStop['state'] =>
        done ? 'done' : previousDone && !rejected ? 'current' : 'upcoming';

    return [
        { label: 'Diajukan', state: 'done' },
        { label: 'Atasan', state: stage(reached.level1, true) },
        { label: 'Finance', state: stage(reached.finance, reached.level1) },
        { label: 'Cair', state: stage(reached.disbursed, reached.finance) },
    ];
}

export default function Dashboard({
    overview,
    today,
    monthRecap,
    pendingLeaveCount,
    kasbon,
}: Props) {
    const hasClockedIn = !!today.clock_in_at;
    const hasClockedOut = !!today.clock_out_at;

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Ringkasan hari ini"
                    description={formatDate(today.date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                />

                {overview && (
                    <section aria-labelledby="overview-heading" className="grid gap-3">
                        <h2 id="overview-heading" className="text-lg font-semibold">
                            Statistik seluruh pegawai
                        </h2>
                        <dl className="tabular grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 md:grid-cols-3">
                            {[
                                ['Total pegawai', overview.totalEmployees],
                                ['Hadir hari ini', overview.presentToday],
                                ['Terlambat hari ini', overview.lateToday],
                                ['Izin/cuti hari ini', overview.onLeaveToday],
                                ['Kasbon menunggu', overview.pendingCashAdvanceCount],
                                ['Sisa cicilan kasbon', rupiah(overview.outstandingCashAdvance)],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-sm text-muted-foreground">{label}</dt>
                                    <dd className="text-2xl font-bold">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}

                <section
                    aria-labelledby="today-heading"
                    className="grid gap-5 rounded-xl bg-sidebar p-5 text-sidebar-foreground md:grid-cols-[1fr_auto] md:items-center md:p-6"
                >
                    <div className="grid gap-4">
                        <h2
                            id="today-heading"
                            className="text-lg font-semibold text-sidebar-accent-foreground"
                        >
                            Absensi
                        </h2>
                        <dl className="tabular flex gap-8">
                            <div>
                                <dt className="text-sm text-sidebar-foreground/75">
                                    Masuk
                                </dt>
                                <dd className="text-3xl font-bold text-sidebar-accent-foreground">
                                    {formatTime(today.clock_in_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-sidebar-foreground/75">
                                    Pulang
                                </dt>
                                <dd className="text-3xl font-bold text-sidebar-accent-foreground">
                                    {formatTime(today.clock_out_at)}
                                </dd>
                            </div>
                        </dl>
                        {today.status && <StatusBadge status={today.status} />}
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    >
                        <Link href={attendanceIndex()}>
                            <Clock />
                            {!hasClockedIn
                                ? 'Absen masuk'
                                : !hasClockedOut
                                  ? 'Absen pulang'
                                  : 'Lihat absensi'}
                        </Link>
                    </Button>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                    <section aria-labelledby="recap-heading" className="grid gap-3">
                        <h2 id="recap-heading" className="text-lg font-semibold">
                            Bulan ini
                        </h2>
                        <dl className="tabular grid grid-cols-4 divide-x divide-border rounded-xl border bg-card">
                            {[
                                ['Hadir', monthRecap.present],
                                ['Telat', monthRecap.late],
                                ['Alpa', monthRecap.absent],
                                ['Izin', monthRecap.leave],
                            ].map(([label, value]) => (
                                <div key={label} className="grid gap-1 px-3 py-4 text-center">
                                    <dd className="text-2xl font-bold">{value}</dd>
                                    <dt className="text-xs font-semibold text-muted-foreground">
                                        {label}
                                    </dt>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section aria-labelledby="leave-heading" className="grid gap-3">
                        <h2 id="leave-heading" className="text-lg font-semibold">
                            Izin/Cuti
                        </h2>
                        <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
                            <p className="text-sm">
                                {pendingLeaveCount > 0 ? (
                                    <>
                                        <span className="tabular font-bold">
                                            {pendingLeaveCount}
                                        </span>{' '}
                                        pengajuan menunggu persetujuan
                                    </>
                                ) : (
                                    'Tidak ada pengajuan yang menunggu.'
                                )}
                            </p>
                            <div className="flex shrink-0 gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={leaveIndex()}>Riwayat</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={leaveCreate()}>
                                        <FileText />
                                        Ajukan
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </div>

                <section aria-labelledby="kasbon-heading" className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 id="kasbon-heading" className="text-lg font-semibold">
                            Kasbon
                        </h2>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={cashIndex()}>
                                Semua kasbon
                                <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                    <div className="grid gap-6 rounded-xl border bg-card p-5">
                        <div className="tabular flex flex-wrap gap-x-10 gap-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Sisa limit
                                </p>
                                <p className="text-2xl font-bold">
                                    {rupiah(kasbon.remaining)}
                                </p>
                            </div>
                            {kasbon.next_installment && (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Cicilan berikutnya,{' '}
                                        {formatDate(
                                            kasbon.next_installment.due_date,
                                            { day: 'numeric', month: 'short' },
                                        )}
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {rupiah(kasbon.next_installment.amount)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {kasbon.active ? (
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between gap-3">
                                    <Link
                                        href={cashShow({ cashAdvance: kasbon.active.id })}
                                        className="tabular text-sm font-semibold hover:underline"
                                    >
                                        Kasbon {rupiah(kasbon.active.amount)}
                                    </Link>
                                    <StatusBadge status={kasbon.active.status} />
                                </div>
                                <ApprovalLine stops={kasbonStops(kasbon.active)} />
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                <p>Belum ada kasbon aktif.</p>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={cashIndex()}>
                                        <Wallet />
                                        Ajukan kasbon
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
