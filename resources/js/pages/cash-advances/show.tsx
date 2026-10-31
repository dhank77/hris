import { Head, router } from '@inertiajs/react';
import { show as caShow, index as caIndex } from '@/routes/cash-advances';
import { pay } from '@/routes/cash-advances/installments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Installment = { id: number; period_number: number; due_date: string; amount: number; paid: boolean; paid_at: string | null };
type CashAdvance = {
    id: number;
    amount: number;
    reason: string;
    tenor_months: number;
    installment_amount: number;
    status: string;
    user?: { name: string };
    installments: Installment[];
    approved_level1_at?: string | null;
    approved_finance_at?: string | null;
};

export default function CashAdvancesShow({ cashAdvance }: { cashAdvance: CashAdvance }) {
    const doPay = (id: number) => router.post(pay.url({ installment: id }));

    return (
        <>
            <Head title={`Kasbon #${cashAdvance.id}`} />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader><CardTitle>Detail Kasbon #{cashAdvance.id}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <p><span className="font-medium">Karyawan:</span> {cashAdvance.user?.name}</p>
                        <p><span className="font-medium">Nominal:</span> {Number(cashAdvance.amount).toLocaleString()}</p>
                        <p><span className="font-medium">Tenor:</span> {cashAdvance.tenor_months} bulan</p>
                        <p><span className="font-medium">Cicilan/bln:</span> {Number(cashAdvance.installment_amount).toLocaleString()}</p>
                        <p><span className="font-medium">Alasan:</span> {cashAdvance.reason}</p>
                        <p><span className="font-medium">Status:</span> <Badge>{cashAdvance.status}</Badge></p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Jadwal Cicilan</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Jatuh Tempo</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashAdvance.installments.map((ins) => (
                                    <TableRow key={ins.id}>
                                        <TableCell>{ins.period_number}</TableCell>
                                        <TableCell>{ins.due_date}</TableCell>
                                        <TableCell>{Number(ins.amount).toLocaleString()}</TableCell>
                                        <TableCell><Badge>{ins.paid ? 'Lunas' : 'Belum'}</Badge></TableCell>
                                        <TableCell>
                                            {!ins.paid && (
                                                <Button size="sm" onClick={() => doPay(ins.id)}>Tandai Lunas</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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