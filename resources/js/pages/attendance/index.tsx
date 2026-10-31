import { Head, useForm } from '@inertiajs/react';
import { Camera, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { store, index as attendanceIndex } from '@/routes/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    setGeo({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    }),
                (err) => setGeoError(err.message),
                { enableHighAccuracy: true },
            );
        } else {
            setGeoError('Geolocation tidak didukung browser.');
        }
        return () => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
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

    return (
        <>
            <Head title="Absensi" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Absensi Hari Ini — {today}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Clock In
                                </p>
                                <p className="font-medium">
                                    {attendance?.clock_in_at
                                        ? new Date(
                                              attendance.clock_in_at,
                                          ).toLocaleTimeString()
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Clock Out
                                </p>
                                <p className="font-medium">
                                    {attendance?.clock_out_at
                                        ? new Date(
                                              attendance.clock_out_at,
                                          ).toLocaleTimeString()
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Status
                                </p>
                                <Badge>
                                    {attendance?.status ?? 'belum absen'}
                                </Badge>
                            </div>
                            {attendance?.late_minutes ? (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Terlambat
                                    </p>
                                    <p className="font-medium text-red-600">
                                        {attendance.late_minutes} menit
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            {geo ? (
                                <span>
                                    Lokasi: {geo.lat.toFixed(5)},{' '}
                                    {geo.lng.toFixed(5)}
                                </span>
                            ) : geoError ? (
                                <span className="text-red-600">{geoError}</span>
                            ) : (
                                <span>Mengambil lokasi...</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            {!cameraOn ? (
                                <Button onClick={startCamera} variant="outline">
                                    <Camera className="mr-2 h-4 w-4" /> Aktifkan
                                    Kamera (Selfie)
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full max-w-sm rounded-lg border"
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="hidden"
                                    />
                                    <Button
                                        onClick={capturePhoto}
                                        variant="outline"
                                    >
                                        Ambil Foto
                                    </Button>
                                </div>
                            )}
                            {photoPreview && (
                                <img
                                    src={photoPreview}
                                    alt="selfie"
                                    className="w-32 rounded-lg border"
                                />
                            )}
                        </div>

                        <InputError message={errors.photo || errors.type} />

                        <div className="flex gap-2">
                            <Button
                                onClick={() => submit('clock_in')}
                                disabled={processing || clockedIn}
                            >
                                <Clock className="mr-2 h-4 w-4" /> Clock In
                            </Button>
                            <Button
                                onClick={() => submit('clock_out')}
                                disabled={
                                    processing || !clockedIn || clockedOut
                                }
                                variant="secondary"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Clock
                                Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Rekap Bulan Ini</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Hadir
                            </p>
                            <p className="text-2xl font-bold">
                                {recap.present}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Terlambat
                            </p>
                            <p className="text-2xl font-bold text-amber-600">
                                {recap.late}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Absen
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {recap.absent}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Izin/Cuti/Sakit
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {recap.leave}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [{ title: 'Absensi', href: attendanceIndex() }],
};
