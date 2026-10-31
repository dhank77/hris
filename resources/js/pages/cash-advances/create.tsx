import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, index as caIndex } from '@/routes/cash-advances';

const rupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

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

    const amount = Number(data.amount);
    const tenor = Number(data.tenor_months);
    const estimate =
        amount > 0 && tenor > 0 ? Math.ceil(amount / tenor) : null;

    return (
        <>
            <Head title="Ajukan Kasbon" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Ajukan kasbon"
                    description="Pengajuan diperiksa atasan, lalu finance, sebelum dicairkan."
                />

                <form
                    onSubmit={submit}
                    className="grid w-full max-w-xl gap-5 rounded-xl border bg-card p-4 md:p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Nominal (Rp)</Label>
                        <Input
                            id="amount"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            className="tabular h-12"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                        />
                        <InputError message={errors.amount} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tenor_months">Tenor (bulan)</Label>
                        <Input
                            id="tenor_months"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={24}
                            className="tabular h-12"
                            value={data.tenor_months}
                            onChange={(e) =>
                                setData('tenor_months', e.target.value)
                            }
                        />
                        {estimate !== null && (
                            <p className="tabular text-sm text-muted-foreground">
                                Perkiraan cicilan {rupiah(estimate)} per bulan.
                            </p>
                        )}
                        <InputError message={errors.tenor_months} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Alasan</Label>
                        <textarea
                            id="reason"
                            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                        />
                        <InputError message={errors.reason} />
                    </div>
                    <Button type="submit" size="lg" disabled={processing}>
                        Kirim pengajuan
                    </Button>
                </form>
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
