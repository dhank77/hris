import { Head, Link, router } from '@inertiajs/react';
import { ApprovalLine } from '@/components/approval-line';
import type { ApprovalStop } from '@/components/approval-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    index as caIndex,
    create as caCreate,
    show as caShow,
    approveLevel1,
    approveFinance,
    reject as caReject,
    disburse,
    deductPayroll,
} from '@/routes/cash-advances';

type Installment = {
    id: number;
    period_number: number;
    due_date: string;
    amount: number;
    paid: boolean;
};
type CashAdvance = {
    id: number;
    amount: number;
    reason: string;
    tenor_months: number;
    installment_amount: number;
    status: string;
    approved_level1_at?: string | null;
    approved_finance_at?: string | null;
    disbursed_at?: string | null;
    user?: { id: number; name: string };
    installments: Installment[];
};
type Stats = {
    limit: number;
    used: number;
    remaining: number;
    totalUnpaid: number;
};

const rupiah = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

const shortDate = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
          })
        : undefined;

function kasbonStops(ca: CashAdvance): ApprovalStop[] {
    const rejected = ca.status === 'rejected';
    const reached = [
        true,
        !!ca.approved_level1_at,
        !!ca.approved_finance_at,
        !!ca.disbursed_at,
    ];
    const labels = ['Diajukan', 'Atasan', 'Finance', 'Cair'];
    const details = [
        undefined,
        shortDate(ca.approved_level1_at),
        shortDate(ca.approved_finance_at),
        shortDate(ca.disbursed_at),
    ];
    const firstOpen = reached.findIndex((done) => !done);

    return labels.map((label, i) => ({
        label,
        detail: details[i],
        state: reached[i]
            ? 'done'
            : i === firstOpen
              ? rejected
                  ? 'rejected'
                  : 'current'
              : 'upcoming',
    }));
}

export default function CashAdvancesIndex({
    cashAdvances,
    stats,
}: {
    cashAdvances: CashAdvance[];
    stats: Stats;
}) {
    const doApproveLevel1 = (id: number) =>
        router.post(approveLevel1.url({ cashAdvance: id }));
    const doApproveFinance = (id: number) =>
        router.post(approveFinance.url({ cashAdvance: id }));
    const doReject = (id: number) => {
        const reason = prompt('Alasan penolakan?') || '';
        router.post(caReject.url({ cashAdvance: id }), {
            rejection_reason: reason,
        });
    };
    const doDisburse = (id: number) =>
        router.post(disburse.url({ cashAdvance: id }));
    const doDeduct = () => router.post(deductPayroll.url());

    const summary = [
        { label: 'Limit kasbon', value: stats.limit },
        { label: 'Terpakai', value: stats.used },
        { label: 'Sisa limit', value: stats.remaining },
        { label: 'Belum lunas', value: stats.totalUnpaid },
    ];

    return (
        <>
            <Head title="Kasbon Pegawai" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Kasbon"
                    description="Pantau pengajuan dan cicilan kasbon."
                    actions={
                        <>
                            <Button
                                onClick={doDeduct}
                                variant="outline"
                                size="sm"
                            >
                                Potong gaji otomatis
                            </Button>
                            <Button asChild size="sm">
                                <Link href={caCreate.url()}>
                                    Ajukan kasbon
                                </Link>
                            </Button>
                        </>
                    }
                />

                <section aria-label="Ringkasan limit">
                    <dl className="tabular grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border bg-card p-4 md:grid-cols-4">
                        {summary.map((item) => (
                            <div key={item.label}>
                                <dt className="text-sm text-muted-foreground">
                                    {item.label}
                                </dt>
                                <dd className="text-lg font-bold">
                                    {rupiah(item.value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section aria-labelledby="list-heading" className="grid gap-3">
                    <h2 id="list-heading" className="text-lg font-semibold">
                        Daftar kasbon
                    </h2>

                    {cashAdvances.length === 0 && (
                        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                            Belum ada pengajuan kasbon.
                        </p>
                    )}

                    <ul className="grid gap-3">
                        {cashAdvances.map((ca) => {
                            const paidCount = ca.installments.filter(
                                (i) => i.paid,
                            ).length;
                            const total = ca.installments.length;

                            return (
                                <li
                                    key={ca.id}
                                    className="grid gap-4 rounded-xl border bg-card p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="grid gap-0.5">
                                            <p className="font-semibold">
                                                {ca.user?.name ??
                                                    `Kasbon #${ca.id}`}
                                            </p>
                                            <p className="tabular text-sm text-muted-foreground">
                                                {rupiah(ca.amount)} ·{' '}
                                                {ca.tenor_months} bulan ·{' '}
                                                {rupiah(ca.installment_amount)}
                                                /bln
                                            </p>
                                        </div>
                                        <StatusBadge status={ca.status} />
                                    </div>

                                    <ApprovalLine stops={kasbonStops(ca)} />

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="tabular text-sm text-muted-foreground">
                                            Cicilan lunas {paidCount} dari{' '}
                                            {total}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={caShow.url({
                                                        cashAdvance: ca.id,
                                                    })}
                                                >
                                                    Detail
                                                </Link>
                                            </Button>
                                            {ca.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            doApproveLevel1(
                                                                ca.id,
                                                            )
                                                        }
                                                    >
                                                        Setujui (atasan)
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            doReject(ca.id)
                                                        }
                                                    >
                                                        Tolak
                                                    </Button>
                                                </>
                                            )}
                                            {ca.status === 'approved_level1' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            doApproveFinance(
                                                                ca.id,
                                                            )
                                                        }
                                                    >
                                                        Setujui (finance)
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            doReject(ca.id)
                                                        }
                                                    >
                                                        Tolak
                                                    </Button>
                                                </>
                                            )}
                                            {ca.status ===
                                                'approved_finance' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        doDisburse(ca.id)
                                                    }
                                                >
                                                    Cairkan
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </>
    );
}

CashAdvancesIndex.layout = {
    breadcrumbs: [{ title: 'Kasbon', href: caIndex() }],
};
