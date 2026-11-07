import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { recap, index as attendanceIndex } from '@/routes/attendance';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import {
    SortableHead,
    TablePagination,
    TableSearch,
    navigateTable,
    readSearch,
    readSort,
} from '@/components/table-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Paginator } from '@/components/table-controls';

type Attendance = {
    id: number;
    date: string;
    status: string;
    late_minutes: number;
    user?: { id: number; name: string };
    clock_in_at: string | null;
    clock_out_at: string | null;
};

const formatTime = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '--:--';

export default function AttendanceRecap({
    attendances,
    start,
    end,
}: {
    attendances: Paginator<Attendance>;
    start: string;
    end: string;
}) {
    const [s, setS] = useState(start);
    const [e, setE] = useState(end);
    const url = recap();
    const { sort, dir } = readSort('date');
    const search = readSearch();

    const apply = () => navigateTable(url, { start: s, end: e });

    return (
        <>
            <Head title="Rekap Absensi" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Rekap kehadiran tim"
                    description="Pilih rentang tanggal untuk melihat kehadiran anggota tim."
                />

                <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
                    <div className="grid gap-1.5">
                        <Label htmlFor="start">Mulai</Label>
                        <Input
                            id="start"
                            type="date"
                            value={s}
                            onChange={(ev) => setS(ev.target.value)}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="end">Selesai</Label>
                        <Input
                            id="end"
                            type="date"
                            value={e}
                            onChange={(ev) => setE(ev.target.value)}
                        />
                    </div>
                    <Button
                        onClick={apply}
                        className="col-span-2 sm:col-span-1"
                    >
                        Terapkan
                    </Button>
                    <TableSearch
                        url={url}
                        defaultValue={search}
                        placeholder="Cari pegawai..."
                        className="sm:ml-auto"
                    />
                </div>

                {attendances.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {search
                            ? `Tidak ada data kehadiran untuk pencarian "${search}".`
                            : 'Tidak ada data kehadiran pada rentang ini.'}
                    </p>
                ) : (
                    <>
                        <ul className="grid divide-y rounded-xl border bg-card md:hidden">
                            {attendances.data.map((a) => (
                                <li key={a.id} className="grid gap-1.5 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold">
                                            {a.user?.name}
                                        </span>
                                        <StatusBadge status={a.status} />
                                    </div>
                                    <p className="tabular text-sm text-muted-foreground">
                                        {a.date} · {formatTime(a.clock_in_at)} –{' '}
                                        {formatTime(a.clock_out_at)}
                                        {a.late_minutes > 0 && (
                                            <span className="text-destructive">
                                                {' '}
                                                · terlambat {a.late_minutes} mnt
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
                                        <SortableHead
                                            label="Tanggal"
                                            field="date"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                        />
                                        <SortableHead
                                            label="Karyawan"
                                            field="user"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                        />
                                        <TableHead>Masuk</TableHead>
                                        <TableHead>Pulang</TableHead>
                                        <SortableHead
                                            label="Status"
                                            field="status"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                        />
                                        <SortableHead
                                            label="Terlambat (mnt)"
                                            field="late_minutes"
                                            currentSort={sort}
                                            currentDir={dir}
                                            url={url}
                                            className="text-right"
                                        />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.data.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="tabular">
                                                {a.date}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {a.user?.name}
                                            </TableCell>
                                            <TableCell className="tabular">
                                                {formatTime(a.clock_in_at)}
                                            </TableCell>
                                            <TableCell className="tabular">
                                                {formatTime(a.clock_out_at)}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={a.status}
                                                />
                                            </TableCell>
                                            <TableCell className="tabular text-right">
                                                {a.late_minutes}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                paginator={attendances}
                                url={url}
                                className="border-t"
                            />
                        </div>
                    </>
                )}
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
