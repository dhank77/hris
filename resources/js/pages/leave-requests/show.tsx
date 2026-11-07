import { Head, router } from '@inertiajs/react';
import { ApprovalLine } from '@/components/approval-line';
import type { ApprovalStop } from '@/components/approval-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    approve,
    reject,
    index as leaveIndex,
    show as leaveShow,
} from '@/routes/leave-requests';

type LeaveRequest = {
    id: number;
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    rejection_reason?: string | null;
    approved_at?: string | null;
    user?: { id: number; name: string };
    approver?: { id: number; name: string } | null;
};

const typeLabel: Record<string, string> = {
    leave: 'Cuti',
    sick: 'Sakit',
    permission: 'Izin',
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

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

export default function LeaveRequestsShow({
    leaveRequest,
    canDecide,
}: {
    leaveRequest: LeaveRequest;
    canDecide: boolean;
}) {
    const doApprove = () =>
        router.post(approve.url({ leaveRequest: leaveRequest.id }));
    const doReject = () => {
        const reason = prompt('Alasan penolakan?') || '';
        router.post(reject.url({ leaveRequest: leaveRequest.id }), {
            rejection_reason: reason,
        });
    };

    const facts = [
        { label: 'Pegawai', value: leaveRequest.user?.name },
        {
            label: 'Jenis',
            value: typeLabel[leaveRequest.type] ?? leaveRequest.type,
        },
        { label: 'Mulai', value: formatDate(leaveRequest.start_date) },
        { label: 'Selesai', value: formatDate(leaveRequest.end_date) },
        { label: 'Diputuskan oleh', value: leaveRequest.approver?.name ?? '-' },
    ];

    return (
        <>
            <Head title={`Pengajuan #${leaveRequest.id}`} />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={`Pengajuan ${typeLabel[leaveRequest.type] ?? leaveRequest.type}`}
                    description={leaveRequest.user?.name}
                    actions={<StatusBadge status={leaveRequest.status} />}
                />

                <section className="grid gap-4 rounded-xl border bg-card p-4 md:p-6">
                    <h2 className="text-lg font-semibold">Alur persetujuan</h2>
                    <ApprovalLine stops={leaveStops(leaveRequest.status)} />
                </section>

                <section className="grid gap-3">
                    <h2 className="text-lg font-semibold">Rincian</h2>
                    <dl className="tabular grid gap-x-6 gap-y-4 rounded-xl border bg-card p-4 sm:grid-cols-2 md:grid-cols-3">
                        {facts.map((fact) => (
                            <div key={fact.label}>
                                <dt className="text-sm text-muted-foreground">
                                    {fact.label}
                                </dt>
                                <dd className="font-semibold">{fact.value}</dd>
                            </div>
                        ))}
                        <div className="sm:col-span-2 md:col-span-3">
                            <dt className="text-sm text-muted-foreground">
                                Alasan
                            </dt>
                            <dd className="max-w-prose">
                                {leaveRequest.reason}
                            </dd>
                        </div>
                        {leaveRequest.rejection_reason && (
                            <div className="sm:col-span-2 md:col-span-3">
                                <dt className="text-sm text-muted-foreground">
                                    Alasan penolakan
                                </dt>
                                <dd className="max-w-prose">
                                    {leaveRequest.rejection_reason}
                                </dd>
                            </div>
                        )}
                    </dl>
                </section>

                {canDecide && leaveRequest.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={doApprove}>Setujui</Button>
                        <Button variant="destructive" onClick={doReject}>
                            Tolak
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

LeaveRequestsShow.layout = {
    breadcrumbs: [
        { title: 'Izin/Cuti', href: leaveIndex() },
        { title: 'Detail', href: leaveShow({ leaveRequest: 0 }) },
    ],
};
