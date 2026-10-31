import { Head, Link, router } from '@inertiajs/react';
import {
    approve,
    reject,
    index as leaveIndex,
    create as leaveCreate,
} from '@/routes/leave-requests';
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

type LeaveRequest = {
    id: number;
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    user?: { id: number; name: string };
};

export default function LeaveRequestsIndex({
    leaveRequests,
}: {
    leaveRequests: LeaveRequest[];
}) {
    const doApprove = (id: number) =>
        router.post(approve.url({ leaveRequest: id }));
    const doReject = (id: number) => {
        const reason = prompt('Alasan penolakan?') || '';
        router.post(reject.url({ leaveRequest: id }), {
            rejection_reason: reason,
        });
    };

    return (
        <>
            <Head title="Izin / Sakit / Cuti" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Pengajuan Izin, Sakit, Cuti</CardTitle>
                        <Link href={leaveCreate.url()}>
                            <Button>Buat Pengajuan</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Mulai</TableHead>
                                    <TableHead>Selesai</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaveRequests.map((lr) => (
                                    <TableRow key={lr.id}>
                                        <TableCell>{lr.user?.name}</TableCell>
                                        <TableCell>{lr.type}</TableCell>
                                        <TableCell>{lr.start_date}</TableCell>
                                        <TableCell>{lr.end_date}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {lr.reason}
                                        </TableCell>
                                        <TableCell>
                                            <Badge>{lr.status}</Badge>
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            {lr.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            doApprove(lr.id)
                                                        }
                                                    >
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            doReject(lr.id)
                                                        }
                                                    >
                                                        Tolak
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {leaveRequests.length === 0 && (
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

LeaveRequestsIndex.layout = {
    breadcrumbs: [{ title: 'Izin/Cuti', href: leaveIndex() }],
};
