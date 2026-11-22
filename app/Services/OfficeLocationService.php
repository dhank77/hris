<?php

namespace App\Services;

use App\Models\Setting;

class OfficeLocationService
{
    public const KEY_NAME = 'office_name';

    public const KEY_LATITUDE = 'office_latitude';

    public const KEY_LONGITUDE = 'office_longitude';

    public const KEY_RADIUS_METERS = 'office_radius_meters';

    public const DEFAULT_NAME = 'Kantor Pusat';

    public const DEFAULT_RADIUS_METERS = 100;

    /**
     * Ambil konfigurasi titik koordinat dan radius lokasi kantor.
     *
     * @return array{
     *     name: string,
     *     latitude: float|null,
     *     longitude: float|null,
     *     radius_meters: int,
     *     is_configured: bool,
     * }
     */
    public function getSettings(): array
    {
        $rawLat = Setting::get(self::KEY_LATITUDE);
        $rawLng = Setting::get(self::KEY_LONGITUDE);
        $rawRadius = Setting::get(self::KEY_RADIUS_METERS);
        $rawName = Setting::get(self::KEY_NAME);

        $latitude = is_numeric($rawLat) ? (float) $rawLat : null;
        $longitude = is_numeric($rawLng) ? (float) $rawLng : null;
        $radius = is_numeric($rawRadius) ? max(10, (int) $rawRadius) : self::DEFAULT_RADIUS_METERS;
        $name = is_string($rawName) && trim($rawName) !== '' ? trim($rawName) : self::DEFAULT_NAME;

        return [
            'name' => $name,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'radius_meters' => $radius,
            'is_configured' => $latitude !== null && $longitude !== null,
        ];
    }

    /**
     * Simpan konfigurasi titik koordinat dan radius lokasi kantor.
     */
    public function saveSettings(string $name, float $latitude, float $longitude, int $radiusMeters): void
    {
        Setting::put(self::KEY_NAME, trim($name));
        Setting::put(self::KEY_LATITUDE, (string) $latitude);
        Setting::put(self::KEY_LONGITUDE, (string) $longitude);
        Setting::put(self::KEY_RADIUS_METERS, (string) $radiusMeters);
    }

    /**
     * Validasi apakah koordinat pegawai berada di dalam radius kantor.
     *
     * @return array{
     *     allowed: bool,
     *     message: string|null,
     *     distance_meters: float|null,
     *     office: array{
     *         name: string,
     *         latitude: float|null,
     *         longitude: float|null,
     *         radius_meters: int,
     *         is_configured: bool,
     *     },
     * }
     */
    public function validateWithinRadius(?float $latitude, ?float $longitude): array
    {
        $office = $this->getSettings();

        if (! $office['is_configured'] || $office['latitude'] === null || $office['longitude'] === null) {
            return [
                'allowed' => false,
                'message' => 'Lokasi kantor belum diatur oleh admin/HR.',
                'distance_meters' => null,
                'office' => $office,
            ];
        }

        if ($latitude === null || $longitude === null) {
            return [
                'allowed' => false,
                'message' => 'Koordinat GPS Anda wajib dikirim untuk melakukan absensi.',
                'distance_meters' => null,
                'office' => $office,
            ];
        }

        $distance = round(
            $this->distanceMeters($latitude, $longitude, $office['latitude'], $office['longitude']),
            1
        );

        if ($distance > $office['radius_meters']) {
            return [
                'allowed' => false,
                'message' => sprintf(
                    'Anda berada di luar radius %s (%s m dari kantor, maksimal %d m).',
                    $office['name'],
                    number_format($distance, 0, ',', '.'),
                    $office['radius_meters'],
                ),
                'distance_meters' => $distance,
                'office' => $office,
            ];
        }

        return [
            'allowed' => true,
            'message' => null,
            'distance_meters' => $distance,
            'office' => $office,
        ];
    }

    /**
     * Hitung jarak antar dua koordinat (meter) menggunakan formula Haversine.
     */
    public function distanceMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusMeters = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadiusMeters * $c;
    }
}
