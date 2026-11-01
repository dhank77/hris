import { Head, Link, useForm } from '@inertiajs/react';
import { Camera, Clock, LogIn, LogOut, MapPin, RotateCw } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { store, index as attendanceIndex, history, recap as attendanceRecap } from '@/routes/attendance';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import InputError from '@/components/input-error';

type Attendance = {
    id: number;
    date: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
    status: string;
    late_minutes: number;
    clock_in_photo: string | null;
    clock_out_photo: string | null;
};

export default function AttendanceIndex({
    attendance,
    recap,
    today,
}: {
    attendance: Attendance | null;
    recap: {
        present: number;
        late: number;
        absent: number;
        leave: number;
        total: number;
    };
    today: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [cameraOn, setCameraOn] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        type: 'clock_in' as 'clock_in' | 'clock_out',
        photo: null as File | null,
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const geoErrorMessage = (err: GeolocationPositionError): string => {
        const isMac = /Mac/i.test(navigator.platform);
        switch (err.code) {
            case err.PERMISSION_DENIED:
                return 'akses lokasi ditolak. Izinkan akses lokasi untuk situs ini di pengaturan browser, lalu coba lagi.';
            case err.POSITION_UNAVAILABLE:
                return isMac
                    ? 'sumber lokasi tidak tersedia. Pastikan Location Services aktif dan browser Anda diizinkan mengambil lokasi (Setelan Sistem › Privasi & Keamanan › Location Services › centang Safari/Chrome Anda), lalu coba lagi.'
                    : 'sumber lokasi tidak tersedia. Pastikan Location Services aktif, izinkan browser mengambil lokasi persis (di iPhone: Setelan › Privasi & Keamanan › Location Services › Safari Websites › While Using + Precise Location Aktif), lalu coba lagi.';
            case err.TIMEOUT:
                return 'waktu pengambilan lokasi habis. Coba lagi di area terbuka.';
            default:
                return err.message || 'lokasi tidak diketahui.';
        }
    };

    const requestGeo = (useFallback = false) => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation tidak didukung browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                setGeo({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                }),
            (err) => {
                // POSITION_UNAVAILABLE: coba sekali lagi tanpa high accuracy
                if (err.code === err.POSITION_UNAVAILABLE && !useFallback) {
                    requestGeo(true);
                    return;
                }
                setGeoError(geoErrorMessage(err));
            },
            {
                enableHighAccuracy: !useFallback,
                timeout: 15000,
                maximumAge: 60000,
            },
        );
    };

    useEffect(() => {
        requestGeo();
        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    // <video> baru ter-mount setelah cameraOn true; pasang stream saat itu
    useEffect(() => {
        if (cameraOn && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraOn]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });
            streamRef.current = stream;
            setCameraOn(true);
        } catch {
            alert('Tidak dapat mengakses kamera.');
        }
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const file = new File([blob], `selfie-${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                });
                setData('photo', file);
                setPhotoPreview(canvas.toDataURL('image/jpeg'));
            },
            'image/jpeg',
            0.9,
        );
    };

    const submit = (type: 'clock_in' | 'clock_out') => {
        setData('type', type);
        if (geo) {
            setData('latitude', geo.lat);
            setData('longitude', geo.lng);
        }
        // need delay for state? Use post with explicit data
        const payload = {
            type,
            photo: data.photo,
            latitude: geo?.lat ?? null,
            longitude: geo?.lng ?? null,
        };
        // useForm setData is async-ish; instead use transform? Simpler: set then post in next tick
        setData(payload as any);
        setTimeout(
            () =>
                post(store.url(), {
                    forceFormData: true,
                    preserveScroll: true,
                }),
            50,
        );
    };

    const clockedIn = !!attendance?.clock_in_at;
    const clockedOut = !!attendance?.clock_out_at;

    const formatTime = (iso: string | null | undefined) =>
        iso
            ? new Date(iso).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : '--:--';

    const nextType = clockedIn ? 'clock_out' : 'clock_in';
    const isDone = clockedIn && clockedOut;

    const recapItems = [
        { label: 'Hadir', value: recap.present, tone: 'text-success' },
        { label: 'Terlambat', value: recap.late, tone: 'text-warning-foreground' },
        { label: 'Alpa', value: recap.absent, tone: 'text-destructive' },
        { label: 'Izin/Cuti/Sakit', value: recap.leave, tone: 'text-info' },
    ];

    return (
        <>
            <Head title="Absensi" />
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Absensi"
                    description={today}
                    actions={
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={history.url()}>Riwayat</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={attendanceRecap.url()}>Rekap</Link>
                            </Button>
                        </div>
                    }
                />

                <section
                    aria-labelledby="today-heading"
                    className="grid gap-5 rounded-xl border bg-card p-4 md:p-6"
                >
                    <div className="flex items-center justify-between gap-3">
                        <h2 id="today-heading" className="text-lg font-semibold">
                            Hari ini
                        </h2>
                        {attendance?.status ? (
                            <StatusBadge status={attendance.status} />
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                Belum absen
                            </span>
                        )}
                    </div>

                    <dl className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <dt className="text-sm text-muted-foreground">Masuk</dt>
                            <dd className="tabular text-4xl font-bold md:text-5xl">
                                {formatTime(attendance?.clock_in_at)}
                            </dd>
                        </div>
                        <div className="grid gap-1">
                            <dt className="text-sm text-muted-foreground">Pulang</dt>
                            <dd className="tabular text-4xl font-bold md:text-5xl">
                                {formatTime(attendance?.clock_out_at)}
                            </dd>
                        </div>
                    </dl>
                    {attendance?.late_minutes ? (
                        <p className="tabular text-sm font-medium text-destructive">
                            Terlambat {attendance.late_minutes} menit
                        </p>
                    ) : null}

                    <div className="grid gap-3 rounded-lg bg-muted p-3 md:grid-cols-[1fr_auto] md:items-start md:gap-6">
                        <div className="grid gap-3">
                            <div
                                className="flex items-center gap-2 text-sm"
                                role="status"
                            >
                                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                                {geo ? (
                                    <span className="tabular">
                                        Lokasi terkunci: {geo.lat.toFixed(5)},{' '}
                                        {geo.lng.toFixed(5)}
                                    </span>
                                ) : geoError ? (
                                    <span className="text-destructive">
                                        Lokasi gagal: {geoError}
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 ps-1 align-baseline"
                                            onClick={() => {
                                                setGeo(null);
                                                requestGeo();
                                            }}
                                        >
                                            <RotateCw aria-hidden="true" /> Coba lagi
                                        </Button>
                                    </span>
                                ) : (
                                    <span>Mengambil lokasi...</span>
                                )}
                            </div>

                            {!cameraOn ? (
                                <Button
                                    type="button"
                                    onClick={startCamera}
                                    variant="outline"
                                    className="w-full sm:w-fit"
                                >
                                    <Camera aria-hidden="true" /> Aktifkan kamera (selfie)
                                </Button>
                            ) : (
                                <div className="grid gap-2">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="aspect-[4/3] w-full max-w-sm rounded-lg border bg-black object-cover"
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <Button
                                        type="button"
                                        onClick={capturePhoto}
                                        variant="outline"
                                        className="w-full sm:w-fit"
                                    >
                                        <Camera aria-hidden="true" />
                                        {photoPreview ? 'Ambil ulang foto' : 'Ambil foto'}
                                    </Button>
                                </div>
                            )}
                        </div>
                        {photoPreview && (
                            <img
                                src={photoPreview}
                                alt="Pratinjau selfie absensi"
                                className="w-28 rounded-lg border"
                            />
                        )}
                    </div>

                    <InputError message={errors.photo || errors.type} />

                    {isDone ? (
                        <p className="flex items-center gap-2 text-sm font-medium text-success">
                            <Clock className="size-4" aria-hidden="true" />
                            Absensi hari ini sudah lengkap. Sampai jumpa besok.
                        </p>
                    ) : (
                        <Button
                            type="button"
                            size="lg"
                            className="w-full text-base"
                            onClick={() => submit(nextType)}
                            disabled={processing}
                        >
                            {nextType === 'clock_in' ? (
                                <LogIn aria-hidden="true" />
                            ) : (
                                <LogOut aria-hidden="true" />
                            )}
                            {processing
                                ? 'Mengirim...'
                                : nextType === 'clock_in'
                                  ? 'Absen masuk'
                                  : 'Absen pulang'}
                        </Button>
                    )}
                </section>

                <section aria-labelledby="recap-heading" className="grid gap-3">
                    <h2 id="recap-heading" className="text-lg font-semibold">
                        Rekap bulan ini
                    </h2>
                    <dl className="grid grid-cols-2 divide-x divide-y rounded-xl border bg-card sm:grid-cols-4 sm:divide-y-0">
                        {recapItems.map((item) => (
                            <div key={item.label} className="flex items-baseline justify-between gap-2 p-3">
                                <dt className="text-sm text-muted-foreground">{item.label}</dt>
                                <dd className={`tabular text-xl font-bold ${item.tone}`}>
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>
        </>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [{ title: 'Absensi', href: attendanceIndex() }],
};
