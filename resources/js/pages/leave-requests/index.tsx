import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import {
    approve,
    reject,
    index as leaveIndex,
    create as leaveCreate,
} from '@/routes/leave-requests';
import { ApprovalLine } from '@/components/approval-line';
import type { ApprovalStop } from '@/components/approval-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';

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

function leaveStops(status: string): ApprovalStop[] {
    return [
        { label: 'Diajukan', state: 'done' },
        {
            label: 'Atasan',
            state:
                status === 'approved'
                    ? 'done'
                    : status === 'rejected'
                      ? 'rejected'
                      : 'current',
        },
        {
            label: status === 'rejected' ? 'Ditolak' : 'Disetujui',
            state: status === 'approved' ? 'done' : 'upcoming',
        },
    ];
}

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
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Izin, sakit, dan cuti"
                    description="Pantau posisi setiap pengajuan di jalur persetujuan."
                    actions={
                        <Button asChild>
                            <Link href={leaveCreate.url()}>
                                <Plus aria-hidden="true" /> Buat pengajuan
                            </Link>
                        </Button>
                    }
                />

                {leaveRequests.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Belum ada pengajuan. Pilih &quot;Buat pengajuan&quot; untuk memulai.
                    </p>
                ) : (
                    <ul className="grid gap-3">
                        {leaveRequests.map((lr) => (
                            <li
                                key={lr.id}
                                className="grid gap-4 rounded-xl border bg-card p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="grid gap-0.5">
                                        <h2 className="text-lg font-semibold">
                                            {typeLabel[lr.type] ?? lr.type}
                                            {lr.user?.name && (
                                                <span className="font-normal text-muted-foreground">
                                                    {' '}· {lr.user.name}
                                                </span>
                                            )}
                                        </h2>
                                        <p className="tabular text-sm text-muted-foreground">
                                            {lr.start_date} – {lr.end_date}
                                        </p>
                                    </div>
                                    <StatusBadge status={lr.status} />
                                </div>
                                <p className="max-w-prose text-sm">{lr.reason}</p>
                                <ApprovalLine stops={leaveStops(lr.status)} />
                                {lr.status === 'pending' && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" onClick={() => doApprove(lr.id)}>
                                            Setujui
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => doReject(lr.id)}
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

LeaveRequestsIndex.layout = {
    breadcrumbs: [{ title: 'Izin/Cuti', href: leaveIndex() }],
};
