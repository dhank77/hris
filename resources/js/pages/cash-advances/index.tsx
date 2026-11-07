import { Head, Link, router } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import {
    SortableHead,
    TablePagination,
    TableSearch,
    readSearch,
    readSort,
} from '@/components/table-controls';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    index as caIndex,
    create as caCreate,
    show as caShow,
    deductPayroll,
} from '@/routes/cash-advances';
import type { Paginator } from '@/components/table-controls';

type Installment = {
    id: number;
    paid: boolean;
};
type CashAdvance = {
    id: number;
    amount: number;
    tenor_months: number;
    installment_amount: number;
    status: string;
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

export default function CashAdvancesIndex({
    cashAdvances,
    stats,
}: {
    cashAdvances: Paginator<CashAdvance>;
    stats: Stats;
}) {
    const doDeduct = () => router.post(deductPayroll.url());
    const url = caIndex();
    const { sort, dir } = readSort('created_at');
    const search = readSearch();

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
                    description="Daftar pengajuan kasbon. Buka detail untuk persetujuan dan cicilan."
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
                                <Link href={caCreate.url()}>Ajukan kasbon</Link>
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

                    {cashAdvances.data.length === 0 ? (
                        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                            {search
                                ? `Tidak ada kasbon yang cocok dengan pencarian "${search}".`
                                : 'Belum ada pengajuan kasbon.'}
                        </p>
                    ) : (
                        <div className="rounded-xl border bg-card">
                            <TableSearch
                                url={url}
                                defaultValue={search}
                                placeholder="Cari pegawai atau alasan..."
                                className="p-3"
                            />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHead
                                            label="Pegawai"
                                            field="user"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                        />
                                        <SortableHead
                                            label="Nominal"
                                            field="amount"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                            className="text-right"
                                        />
                                        <SortableHead
                                            label="Tenor"
                                            field="tenor_months"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                        />
                                        <TableHead>Cicilan lunas</TableHead>
                                        <SortableHead
                                            label="Status"
                                            field="status"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                        />
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashAdvances.data.map((ca) => (
                                        <TableRow key={ca.id}>
                                            <TableCell className="font-medium">
                                                {ca.user?.name ??
                                                    `Kasbon #${ca.id}`}
                                            </TableCell>
                                            <TableCell className="tabular text-right">
                                                {rupiah(ca.amount)}
                                            </TableCell>
                                            <TableCell className="tabular">
                                                {ca.tenor_months} bln
                                            </TableCell>
                                            <TableCell className="tabular">
                                                {
                                                    ca.installments.filter(
                                                        (i) => i.paid,
                                                    ).length
                                                }
                                                /{ca.installments.length}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={ca.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                paginator={cashAdvances}
                                url={url}
                                className="border-t"
                            />
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

CashAdvancesIndex.layout = {
    breadcrumbs: [{ title: 'Kasbon', href: caIndex() }],
};
