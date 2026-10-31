import { Head, router } from '@inertiajs/react';
import { ApprovalLine } from '@/components/approval-line';
import type { ApprovalStop } from '@/components/approval-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as caShow, index as caIndex } from '@/routes/cash-advances';
import { pay } from '@/routes/cash-advances/installments';

type Installment = {
    id: number;
    period_number: number;
    due_date: string;
    amount: number;
    paid: boolean;
    paid_at: string | null;
};
type CashAdvance = {
    id: number;
    amount: number;
    reason: string;
    tenor_months: number;
    installment_amount: number;
    status: string;
    user?: { id: number; name: string };
    installments: Installment[];
    approved_level1_at?: string | null;
    approved_finance_at?: string | null;
    disbursed_at?: string | null;
};

const rupiah = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

const formatDate = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
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
        formatDate(ca.approved_level1_at),
        formatDate(ca.approved_finance_at),
        formatDate(ca.disbursed_at),
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

export default function CashAdvancesShow({
    cashAdvance,
}: {
    cashAdvance: CashAdvance;
}) {
    const doPay = (id: number) => router.post(pay.url({ installment: id }));

    const facts = [
        { label: 'Karyawan', value: cashAdvance.user?.name },
        { label: 'Nominal', value: rupiah(cashAdvance.amount) },
        { label: 'Tenor', value: `${cashAdvance.tenor_months} bulan` },
        {
            label: 'Cicilan per bulan',
            value: rupiah(cashAdvance.installment_amount),
        },
    ];

    return (
        <>
            <Head title={`Kasbon #${cashAdvance.id}`} />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={`Kasbon #${cashAdvance.id}`}
                    description={cashAdvance.user?.name}
                    actions={<StatusBadge status={cashAdvance.status} />}
                />

                <section
                    aria-labelledby="flow-heading"
                    className="grid gap-4 rounded-xl border bg-card p-4 md:p-6"
                >
                    <h2 id="flow-heading" className="text-lg font-semibold">
                        Alur persetujuan
                    </h2>
                    <ApprovalLine stops={kasbonStops(cashAdvance)} />
                </section>

                <section aria-labelledby="detail-heading" className="grid gap-3">
                    <h2 id="detail-heading" className="text-lg font-semibold">
                        Rincian
                    </h2>
                    <dl className="tabular grid gap-x-6 gap-y-4 rounded-xl border bg-card p-4 sm:grid-cols-2 md:grid-cols-4">
                        {facts.map((fact) => (
                            <div key={fact.label}>
                                <dt className="text-sm text-muted-foreground">
                                    {fact.label}
                                </dt>
                                <dd className="font-semibold">{fact.value}</dd>
                            </div>
                        ))}
                        <div className="sm:col-span-2 md:col-span-4">
                            <dt className="text-sm text-muted-foreground">
                                Alasan
                            </dt>
                            <dd className="max-w-prose">{cashAdvance.reason}</dd>
                        </div>
                    </dl>
                </section>

                <section
                    aria-labelledby="installments-heading"
                    className="grid gap-3"
                >
                    <h2
                        id="installments-heading"
                        className="text-lg font-semibold"
                    >
                        Jadwal cicilan
                    </h2>
                    <div className="overflow-x-auto rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Jatuh tempo</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Aksi</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashAdvance.installments.map((ins) => (
                                    <TableRow key={ins.id}>
                                        <TableCell>{ins.period_number}</TableCell>
                                        <TableCell>
                                            {formatDate(ins.due_date) ??
                                                ins.due_date}
                                        </TableCell>
                                        <TableCell>
                                            {rupiah(ins.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={
                                                    ins.paid ? 'paid' : 'unpaid'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!ins.paid && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        doPay(ins.id)
                                                    }
                                                >
                                                    Tandai lunas
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </section>
            </div>
        </>
    );
}

CashAdvancesShow.layout = {
    breadcrumbs: [
        { title: 'Kasbon', href: caIndex() },
        { title: 'Detail', href: caShow({ cashAdvance: 0 }) },
    ],
};
