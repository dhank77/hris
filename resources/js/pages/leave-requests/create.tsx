import { Head, useForm } from '@inertiajs/react';
import { store } from '@/routes/leave-requests';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import InputError from '@/components/input-error';
import { index as leaveIndex } from '@/routes/leave-requests';

export default function LeaveRequestsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        type: 'leave',
        start_date: '',
        end_date: '',
        reason: '',
        attachment: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), { forceFormData: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Buat Pengajuan" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Buat pengajuan"
                    description="Ajukan izin, sakit, atau cuti. Atasan akan menerima pengajuan Anda."
                />
                <div className="w-full max-w-2xl">
                    <form onSubmit={submit} className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Jenis</Label>
                            <Select
                                value={data.type}
                                onValueChange={(v) => setData('type', v)}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="leave">Cuti</SelectItem>
                                    <SelectItem value="sick">Sakit</SelectItem>
                                    <SelectItem value="permission">
                                        Izin
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="start_date">Tanggal mulai</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                            />
                            <InputError message={errors.start_date} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end_date">Tanggal selesai</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) =>
                                    setData('end_date', e.target.value)
                                }
                            />
                            <InputError message={errors.end_date} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Alasan</Label>
                            <textarea
                                id="reason"
                                className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                                value={data.reason}
                                onChange={(e) =>
                                    setData('reason', e.target.value)
                                }
                            />
                            <InputError message={errors.reason} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="attachment">
                                Lampiran (opsional)
                            </Label>
                            <Input
                                id="attachment"
                                type="file"
                                onChange={(e) =>
                                    setData(
                                        'attachment',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <InputError message={errors.attachment} />
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            disabled={processing}
                            className="w-full sm:w-fit"
                        >
                            {processing ? 'Mengirim...' : 'Kirim pengajuan'}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}

LeaveRequestsCreate.layout = {
    breadcrumbs: [
        { title: 'Izin/Cuti', href: leaveIndex() },
        { title: 'Buat', href: leaveIndex() },
    ],
};
