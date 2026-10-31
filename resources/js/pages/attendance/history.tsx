import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { history, index as attendanceIndex } from '@/routes/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type Attendance = {
    id: number;
    date: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
    status: string;
    late_minutes: number;
};

export default function AttendanceHistory({ attendances, period }: { attendances: Attendance[]; period: string }) {
    const changePeriod = (p: string) => {
        router.get(history.url(), { period: p }, { preserveState: true });
    };

    return (
        <>
            <Head title="Riwayat Absensi" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Riwayat Kehadiran</CardTitle>
                        <div className="flex gap-2">
                            {['daily', 'weekly', 'monthly'].map((p) => (
                                <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => changePeriod(p)}>
                                    {p}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Terlambat (mnt)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.date}</TableCell>
                                        <TableCell>{a.clock_in_at ? new Date(a.clock_in_at).toLocaleTimeString() : '-'}</TableCell>
                                        <TableCell>{a.clock_out_at ? new Date(a.clock_out_at).toLocaleTimeString() : '-'}</TableCell>
                                        <TableCell><Badge>{a.status}</Badge></TableCell>
                                        <TableCell>{a.late_minutes}</TableCell>
                                    </TableRow>
                                ))}
                                {attendances.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">Tidak ada data</TableCell>
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

AttendanceHistory.layout = {
    breadcrumbs: [
        { title: 'Absensi', href: attendanceIndex() },
        { title: 'Riwayat', href: history() },
    ],
};