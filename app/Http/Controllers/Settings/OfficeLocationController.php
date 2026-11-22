<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\OfficeLocationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfficeLocationController extends Controller
{
    public function __construct(
        private readonly OfficeLocationService $officeLocation,
    ) {}

    /**
     * Tampilkan halaman pengaturan titik koordinat dan radius lokasi kantor (admin/HR).
     */
    public function edit(Request $request): Response
    {
        if (! in_array($request->user()->role, ['admin', 'hr'], true)) {
            abort(403);
        }

        return Inertia::render('settings/office-location', [
            'officeLocation' => $this->officeLocation->getSettings(),
        ]);
    }

    /**
     * Simpan titik koordinat dan radius lokasi kantor (admin/HR).
     */
    public function update(Request $request): RedirectResponse
    {
        if (! in_array($request->user()->role, ['admin', 'hr'], true)) {
            abort(403);
        }

        $validated = $request->validate([
            'office_name' => ['required', 'string', 'max:120'],
            'office_latitude' => ['required', 'numeric', 'between:-90,90'],
            'office_longitude' => ['required', 'numeric', 'between:-180,180'],
            'office_radius_meters' => ['required', 'integer', 'min:10', 'max:10000'],
        ]);

        $this->officeLocation->saveSettings(
            name: (string) $validated['office_name'],
            latitude: (float) $validated['office_latitude'],
            longitude: (float) $validated['office_longitude'],
            radiusMeters: (int) $validated['office_radius_meters'],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Lokasi kantor dan radius absensi disimpan.'),
        ]);

        return to_route('office-location.edit');
    }
}
