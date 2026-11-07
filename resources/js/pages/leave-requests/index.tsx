import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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
    index as leaveIndex,
    create as leaveCreate,
    show as leaveShow,
} from '@/routes/leave-requests';
import type { Paginator } from '@/components/table-controls';

type LeaveRequest = {
    id: number;
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    user?: { id: number; name: string };
};

const typeLabel: Record<string, string> = {
    leave: 'Cuti',
    sick: 'Sakit',
    permission: 'Izin',
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

export default function LeaveRequestsIndex({
    leaveRequests,
}: {
    leaveRequests: Paginator<LeaveRequest>;
}) {
    const url = leaveIndex();
    const { sort, dir } = readSort('created_at');
    const search = readSearch();

    return (
        <>
            <Head title="Izin / Sakit / Cuti" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Izin, sakit, dan cuti"
                    description="Daftar pengajuan. Buka detail untuk menyetujui atau menolak."
                    actions={
                        <Button asChild>
                            <Link href={leaveCreate.url()}>
                                <Plus aria-hidden="true" /> Buat pengajuan
                            </Link>
                        </Button>
                    }
                />

                {leaveRequests.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {search
                            ? `Tidak ada pengajuan yang cocok dengan pencarian "${search}".`
                            : 'Belum ada pengajuan. Pilih "Buat pengajuan" untuk memulai.'}
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
                                        label="Jenis"
                                        field="type"
                                        currentSort={sort}
                                        currentDir={dir}
                                        url={url}
                                    />
                                    <SortableHead
                                        label="Tanggal"
                                        field="start_date"
                                        currentSort={sort}
                                        currentDir={dir}
                                        url={url}
                                    />
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
                                {leaveRequests.data.map((lr) => (
                                    <TableRow key={lr.id}>
                                        <TableCell className="font-medium">
                                            {lr.user?.name ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {typeLabel[lr.type] ?? lr.type}
                                        </TableCell>
                                        <TableCell className="tabular whitespace-nowrap">
                                            {formatDate(lr.start_date)} –{' '}
                                            {formatDate(lr.end_date)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={lr.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Link
                                                    href={leaveShow.url({
                                                        leaveRequest: lr.id,
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
                            paginator={leaveRequests}
                            url={url}
                            className="border-t"
                        />
                    </div>
                )}
            </div>
        </>
    );
}

LeaveRequestsIndex.layout = {
    breadcrumbs: [{ title: 'Izin/Cuti', href: leaveIndex() }],
};
