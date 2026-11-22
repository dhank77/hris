import { Head, useForm } from '@inertiajs/react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Circle,
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import OfficeLocationController from '@/actions/App/Http/Controllers/Settings/OfficeLocationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Perbaiki path ikon default Leaflet agar tampil benar saat dibundel Vite.
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

type OfficeLocationProps = {
    name: string;
    latitude: number | null;
    longitude: number | null;
    radius_meters: number;
    is_configured: boolean;
};

const FALLBACK_CENTER = { lat: -6.2088, lng: 106.8456 }; // Jakarta

function MapClickHandler({
    onSelect,
}: {
    onSelect: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(event) {
            onSelect(event.latlng.lat, event.latlng.lng);
        },
    });
    return null;
}

function MapViewSync({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom(), { animate: true });
    }, [lat, lng, map]);
    return null;
}

export default function OfficeLocationSettings({
    officeLocation,
}: {
    officeLocation: OfficeLocationProps;
}) {
    const initialLat = officeLocation.latitude ?? FALLBACK_CENTER.lat;
    const initialLng = officeLocation.longitude ?? FALLBACK_CENTER.lng;

    const { data, setData, submit, processing, errors } = useForm({
        office_name: officeLocation.name,
        office_latitude: initialLat.toFixed(6),
        office_longitude: initialLng.toFixed(6),
        office_radius_meters: officeLocation.radius_meters,
    });

    const [locating, setLocating] = useState(false);
    const [geoMessage, setGeoMessage] = useState<string | null>(null);

    const parsedLat = Number.parseFloat(data.office_latitude);
    const parsedLng = Number.parseFloat(data.office_longitude);
    const validCoords =
        Number.isFinite(parsedLat) &&
        Number.isFinite(parsedLng) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLng >= -180 &&
        parsedLng <= 180;

    const markerLat = validCoords ? parsedLat : initialLat;
    const markerLng = validCoords ? parsedLng : initialLng;
    const radiusMeters = Math.min(
        10000,
        Math.max(10, Number(data.office_radius_meters) || 100),
    );

    const updateCoordinates = (lat: number, lng: number) => {
        setData((prev) => ({
            ...prev,
            office_latitude: lat.toFixed(6),
            office_longitude: lng.toFixed(6),
        }));
        setGeoMessage(null);
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setGeoMessage('Browser tidak mendukung geolocation.');
            return;
        }
        setLocating(true);
        setGeoMessage(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updateCoordinates(pos.coords.latitude, pos.coords.longitude);
                setLocating(false);
            },
            (err) => {
                setGeoMessage(
                    err.message || 'Gagal mengambil lokasi saat ini.',
                );
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 15000 },
        );
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submit(OfficeLocationController.update(), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Lokasi Kantor & Radius Absensi" />

            <h1 className="sr-only">Lokasi Kantor & Radius Absensi</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Lokasi kantor & radius absensi"
                    description="Tentukan titik koordinat kantor dan radius maksimal (meter) agar pegawai hanya bisa melakukan absensi di area kantor."
                />

                {!officeLocation.is_configured && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                        Titik koordinat kantor belum disimpan. Klik peta atau
                        geser marker ke lokasi kantor lalu klik Simpan.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="office_name">Nama Kantor</Label>
                        <Input
                            id="office_name"
                            value={data.office_name}
                            onChange={(e) =>
                                setData('office_name', e.target.value)
                            }
                            placeholder="Kantor Pusat"
                            required
                        />
                        <InputError message={errors.office_name} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-primary" />
                                Peta Titik Lokasi Kantor (klik peta atau geser
                                marker)
                            </Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleUseCurrentLocation}
                                disabled={locating}
                            >
                                <Crosshair className="mr-1.5 h-4 w-4" />
                                {locating
                                    ? 'Mengambil lokasi...'
                                    : 'Gunakan Lokasi Saat Ini'}
                            </Button>
                        </div>

                        {geoMessage && (
                            <p className="text-xs text-destructive">
                                {geoMessage}
                            </p>
                        )}

                        <div className="overflow-hidden rounded-xl border">
                            <MapContainer
                                center={[markerLat, markerLng]}
                                zoom={17}
                                scrollWheelZoom
                                className="z-0 h-80 w-full"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapClickHandler
                                    onSelect={updateCoordinates}
                                />
                                <MapViewSync lat={markerLat} lng={markerLng} />
                                <Marker
                                    position={[markerLat, markerLng]}
                                    draggable
                                    eventHandlers={{
                                        dragend(event) {
                                            const latlng =
                                                event.target.getLatLng();
                                            updateCoordinates(
                                                latlng.lat,
                                                latlng.lng,
                                            );
                                        },
                                    }}
                                />
                                <Circle
                                    center={[markerLat, markerLng]}
                                    radius={radiusMeters}
                                    pathOptions={{
                                        color: '#2563eb',
                                        fillColor: '#3b82f6',
                                        fillOpacity: 0.2,
                                    }}
                                />
                            </MapContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="office_latitude">Latitude</Label>
                            <Input
                                id="office_latitude"
                                type="number"
                                step="any"
                                value={data.office_latitude}
                                onChange={(e) =>
                                    setData('office_latitude', e.target.value)
                                }
                                required
                            />
                            <InputError message={errors.office_latitude} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="office_longitude">Longitude</Label>
                            <Input
                                id="office_longitude"
                                type="number"
                                step="any"
                                value={data.office_longitude}
                                onChange={(e) =>
                                    setData('office_longitude', e.target.value)
                                }
                                required
                            />
                            <InputError message={errors.office_longitude} />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between gap-4">
                            <Label htmlFor="office_radius_meters">
                                Radius Absensi (meter)
                            </Label>
                            <span className="text-sm font-semibold text-primary">
                                {radiusMeters} m
                            </span>
                        </div>
                        <input
                            aria-label="Slider radius absensi"
                            type="range"
                            min={10}
                            max={1000}
                            step={10}
                            value={Math.min(1000, radiusMeters)}
                            onChange={(e) =>
                                setData(
                                    'office_radius_meters',
                                    Number(e.target.value),
                                )
                            }
                            className="w-full accent-primary"
                        />
                        <div className="flex items-center gap-3">
                            <Input
                                id="office_radius_meters"
                                type="number"
                                min={10}
                                max={10000}
                                value={data.office_radius_meters}
                                onChange={(e) =>
                                    setData(
                                        'office_radius_meters',
                                        Number(e.target.value),
                                    )
                                }
                                className="max-w-40"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimal 10 meter, maksimal 10.000 meter (10 km).
                            </p>
                        </div>
                        <InputError message={errors.office_radius_meters} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Lokasi Kantor'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
