import { Head, router } from '@inertiajs/react';
import { history, index as attendanceIndex } from '@/routes/attendance';
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

type Attendance = {
    id: number;
    date: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
    status: string;
    late_minutes: number;
    user?: { id: number; name: string };
};

const periods = [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'all', label: 'Semua' },
];

const formatTime = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '--:--';

export default function AttendanceHistory({
    attendances,
    period,
}: {
    attendances: Attendance[];
    period: string;
}) {
    const changePeriod = (p: string) => {
        router.get(history.url(), { period: p }, { preserveState: true });
    };

    return (
        <>
            <Head title="Riwayat Absensi" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Riwayat kehadiran"
                    description="Catatan masuk dan pulang Anda."
                    actions={
                        <div className="flex gap-1.5" role="group" aria-label="Periode">
                            {periods.map((p) => (
                                <Button
                                    key={p.value}
                                    variant={period === p.value ? 'default' : 'outline'}
                                    size="sm"
                                    aria-pressed={period === p.value}
                                    onClick={() => changePeriod(p.value)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    }
                />

                {attendances.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Belum ada catatan kehadiran pada periode ini.
                    </p>
                ) : (
                    <>
                        <ul className="grid divide-y rounded-xl border bg-card md:hidden">
                            {attendances.map((a) => (
                                <li key={a.id} className="grid gap-1.5 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">
                                            {a.user?.name ? `${a.user.name} · ` : ''}
                                            {a.date}
                                        </span>
                                        <StatusBadge status={a.status} />
                                    </div>
                                    <p className="tabular text-sm text-muted-foreground">
                                        {formatTime(a.clock_in_at)} – {formatTime(a.clock_out_at)}
                                        {a.late_minutes > 0 && (
                                            <span className="text-destructive">
                                                {' '}· terlambat {a.late_minutes} mnt
                                            </span>
                                        )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                        <div className="hidden rounded-xl border bg-card md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pegawai</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Masuk</TableHead>
                                        <TableHead>Pulang</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Terlambat (mnt)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium">{a.user?.name}</TableCell>
                                            <TableCell className="tabular">{a.date}</TableCell>
                                            <TableCell className="tabular">{formatTime(a.clock_in_at)}</TableCell>
                                            <TableCell className="tabular">{formatTime(a.clock_out_at)}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={a.status} />
                                            </TableCell>
                                            <TableCell className="tabular text-right">{a.late_minutes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
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
