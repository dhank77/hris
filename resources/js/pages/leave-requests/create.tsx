import { Head, useForm } from '@inertiajs/react';
import { store } from '@/routes/leave-requests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Pengajuan Izin / Sakit / Cuti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Jenis</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(v) => setData('type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="leave">
                                            Cuti
                                        </SelectItem>
                                        <SelectItem value="sick">
                                            Sakit
                                        </SelectItem>
                                        <SelectItem value="permission">
                                            Izin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tanggal Mulai</Label>
                                <Input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                />
                                <InputError message={errors.start_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tanggal Selesai</Label>
                                <Input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData('end_date', e.target.value)
                                    }
                                />
                                <InputError message={errors.end_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Alasan</Label>
                                <textarea
                                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.reason}
                                    onChange={(e) =>
                                        setData('reason', e.target.value)
                                    }
                                />
                                <InputError message={errors.reason} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Lampiran (opsional)</Label>
                                <Input
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
                            <Button type="submit" disabled={processing}>
                                Kirim
                            </Button>
                        </form>
                    </CardContent>
                </Card>
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
