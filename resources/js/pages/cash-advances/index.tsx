import { Head, Link, router } from '@inertiajs/react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
    user?: { id: number; name: string };
    installments: Installment[];
};

export default function CashAdvancesIndex({
    cashAdvances,
    stats,
}: {
    cashAdvances: CashAdvance[];
    stats: any;
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

    return (
        <>
            <Head title="Kasbon Pegawai" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Limit Kasbon
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {Number(stats.limit).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Terpakai</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-amber-600">
                                {Number(stats.used).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Sisa Limit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">
                                {Number(stats.remaining).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Belum Lunas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600">
                                {Number(stats.totalUnpaid).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Daftar Kasbon</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                onClick={doDeduct}
                                variant="outline"
                                size="sm"
                            >
                                Potong Gaji (Auto)
                            </Button>
                            <Link href={caCreate.url()}>
                                <Button>Buat Pengajuan</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead>Tenor</TableHead>
                                    <TableHead>Cicilan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashAdvances.map((ca) => {
                                    const paidCount = ca.installments.filter(
                                        (i) => i.paid,
                                    ).length;
                                    const total = ca.installments.length || 1;
                                    return (
                                        <TableRow key={ca.id}>
                                            <TableCell>
                                                {ca.user?.name}
                                            </TableCell>
                                            <TableCell>
                                                {Number(
                                                    ca.amount,
                                                ).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {ca.tenor_months} bln
                                            </TableCell>
                                            <TableCell>
                                                {Number(
                                                    ca.installment_amount,
                                                ).toLocaleString()}
                                                /bln
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{ca.status}</Badge>
                                            </TableCell>
                                            <TableCell className="w-32">
                                                <div className="h-2 w-full rounded bg-muted">
                                                    <div
                                                        className="h-2 rounded bg-primary"
                                                        style={{
                                                            width: `${(paidCount / total) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {paidCount}/{total}
                                                </span>
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Link
                                                    href={caShow.url({
                                                        cashAdvance: ca.id,
                                                    })}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        Detail
                                                    </Button>
                                                </Link>
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
                                                            Approve L1
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
                                                    'approved_level1' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                doApproveFinance(
                                                                    ca.id,
                                                                )
                                                            }
                                                        >
                                                            Approve Finance
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
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {cashAdvances.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center text-muted-foreground"
                                        >
                                            Tidak ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CashAdvancesIndex.layout = {
    breadcrumbs: [{ title: 'Kasbon', href: caIndex() }],
};
