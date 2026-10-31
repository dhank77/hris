import { Head, useForm } from '@inertiajs/react';
import { store, index as caIndex } from '@/routes/cash-advances';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import InputError from '@/components/input-error';

export default function CashAdvancesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        reason: '',
        tenor_months: '3',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Ajukan Kasbon" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card className="max-w-2xl">
                    <CardHeader><CardTitle>Pengajuan Kasbon</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Nominal (Rp)</Label>
                                <Input type="number" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                                <InputError message={errors.amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tenor (bulan)</Label>
                                <Input type="number" min={1} max={24} value={data.tenor_months} onChange={(e) => setData('tenor_months', e.target.value)} />
                                <InputError message={errors.tenor_months} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Alasan</Label>
                                <textarea className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={data.reason} onChange={(e) => setData('reason', e.target.value)} />
                                <InputError message={errors.reason} />
                            </div>
                            <Button type="submit" disabled={processing}>Kirim Pengajuan</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CashAdvancesCreate.layout = {
    breadcrumbs: [
        { title: 'Kasbon', href: caIndex() },
        { title: 'Buat', href: caIndex() },
    ],
};