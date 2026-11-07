import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import QrisController from '@/actions/App/Http/Controllers/Settings/QrisController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { decodeQrImage } from '@/lib/decode-qr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ScanStatus = 'idle' | 'scanning' | 'ok' | 'fail';

export default function QrisSettings({
    qrisPayload,
    qrisImage,
    merchantName,
    payloadValid,
}: {
    qrisPayload: string | null;
    qrisImage: string | null;
    merchantName: string | null;
    payloadValid: boolean;
}) {
    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');

    const handleImageSelected = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setScanStatus('scanning');

        try {
            const decoded = (await decodeQrImage(file))?.trim() ?? '';
            const looksLikeQris =
                decoded.startsWith('000201') && decoded.includes('6304');

            const textarea = document.getElementById(
                'qris_payload',
            ) as HTMLTextAreaElement | null;

            if (textarea && looksLikeQris) {
                textarea.value = decoded;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                setScanStatus('ok');
            } else {
                setScanStatus('fail');
            }
        } catch {
            setScanStatus('fail');
        }
    };
    return (
        <>
            <Head title="Pengaturan QRIS" />

            <h1 className="sr-only">Pengaturan QRIS</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="QRIS statis"
                    description="Unggah QRIS statis perusahaan. String hasil scan dipakai untuk membuat QRIS dinamis dengan nominal cicilan."
                />

                {qrisPayload && (
                    <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm">
                            <span
                                className={
                                    payloadValid
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-destructive'
                                }
                            >
                                {payloadValid
                                    ? '✓ QRIS valid'
                                    : '✗ QRIS tidak valid'}
                            </span>
                        </p>
                        {merchantName && (
                            <p className="text-sm text-muted-foreground">
                                Merchant: {merchantName}
                            </p>
                        )}
                    </div>
                )}

                {!qrisPayload && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        String QRIS belum diisi — QRIS dinamis belum bisa
                        dibuat. Unggah gambar QRIS di bawah, string akan terisi
                        otomatis.
                    </p>
                )}

                {qrisImage && (
                    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrisImage}
                            alt="QRIS statis saat ini"
                            width={120}
                            height={120}
                        />
                        <p className="text-sm text-muted-foreground">
                            Gambar QRIS statis saat ini
                        </p>
                    </div>
                )}

                <Form
                    {...QrisController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="qris_image">
                                    Unggah gambar QRIS statis (PNG/JPG)
                                </Label>
                                <Input
                                    id="qris_image"
                                    type="file"
                                    name="qris_image"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleImageSelected}
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.qris_image}
                                />
                                {scanStatus === 'scanning' && (
                                    <p className="text-xs text-muted-foreground">
                                        Membaca string QR dari gambar…
                                    </p>
                                )}
                                {scanStatus === 'ok' && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        ✓ String QRIS otomatis terisi dari
                                        gambar — silakan periksa lalu simpan.
                                    </p>
                                )}
                                {scanStatus === 'fail' && (
                                    <p className="text-xs text-destructive">
                                        QR tidak terbaca dari gambar. Ambil
                                        ulang dengan gambar yang lebih
                                        besar/tajam, atau tempel string hasil
                                        scan secara manual di kolom bawah.
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="qris_payload">
                                    String QRIS statis (hasil scan)
                                </Label>
                                <textarea
                                    id="qris_payload"
                                    name="qris_payload"
                                    placeholder="00020101021126...6304ABCD"
                                    defaultValue={qrisPayload ?? ''}
                                    rows={4}
                                    className="flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:text-foreground placeholder:text-muted-foreground md:text-sm"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.qris_payload}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Diawali 000201, diakhiri 6304. String ini
                                    yang dipakai membuat QRIS dinamis dengan
                                    nominal — dan terisi otomatis saat gambar
                                    diunggah.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Simpan</Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
