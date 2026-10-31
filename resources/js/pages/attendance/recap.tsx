import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { recap, index as attendanceIndex } from '@/routes/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Attendance = {
    id: number;
    date: string;
    status: string;
    late_minutes: number;
    user?: { id: number; name: string };
    clock_in_at: string | null;
    clock_out_at: string | null;
};

export default function AttendanceRecap({ attendances, start, end }: { attendances: Attendance[]; start: string; end: string }) {
    const [s, setS] = useState(start);
    const [e, setE] = useState(end);

    const apply = () => router.get(recap.url(), { start: s, end: e }, { preserveState: true });

    return (
        <>
            <Head title="Rekap Absensi" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Rekap Kehadiran Tim</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <Label htmlFor="start">Mulai</Label>
                                <Input id="start" type="date" value={s} onChange={(ev) => setS(ev.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="end">Selesai</Label>
                                <Input id="end" type="date" value={e} onChange={(ev) => setE(ev.target.value)} />
                            </div>
                            <Button onClick={apply}>Terapkan</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Karyawan</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Terlambat</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendances.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.date}</TableCell>
                                        <TableCell>{a.user?.name}</TableCell>
                                        <TableCell>{a.clock_in_at ? new Date(a.clock_in_at).toLocaleTimeString() : '-'}</TableCell>
                                        <TableCell>{a.clock_out_at ? new Date(a.clock_out_at).toLocaleTimeString() : '-'}</TableCell>
                                        <TableCell><Badge>{a.status}</Badge></TableCell>
                                        <TableCell>{a.late_minutes}</TableCell>
                                    </TableRow>
                                ))}
                                {attendances.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada data</TableCell>
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

AttendanceRecap.layout = {
    breadcrumbs: [
        { title: 'Absensi', href: attendanceIndex() },
        { title: 'Rekap', href: recap() },
    ],
};