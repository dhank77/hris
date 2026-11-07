<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use QrisDinamis\Qris;

class QrisController extends Controller
{
    /**
     * Show the QRIS payment settings page (admin only).
     */
    public function edit(Request $request): Response
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $payload = Setting::get('qris_static_payload');
        $merchant = null;

        if ($payload && Qris::isValid($payload)) {
            try {
                $merchant = Qris::parse($payload)->merchantName;
            } catch (\Throwable) {
                $merchant = null;
            }
        }

        return Inertia::render('settings/qris', [
            'qrisPayload' => $payload,
            'qrisImage' => $this->imageUrl(),
            'merchantName' => $merchant,
            'payloadValid' => $payload !== null && Qris::isValid($payload),
        ]);
    }

    /**
     * Save the static QRIS payload and image (admin only).
     */
    public function update(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $request->validate([
            'qris_payload' => ['nullable', 'string'],
            'qris_image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('qris_image')) {
            $path = $request->file('qris_image')->store('qris', 'public');

            if ($path !== false) {
                Setting::put('qris_static_image', $path);
            }
        }

        if ($request->filled('qris_payload')) {
            $payload = trim((string) $request->input('qris_payload'));

            if (! Qris::isValid($payload)) {
                return back()->withErrors([
                    'qris_payload' => 'String QRIS tidak valid. Periksa kembali hasil scan QRIS statis.',
                ]);
            }

            Setting::put('qris_static_payload', $payload);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pengaturan QRIS disimpan.')]);

        return to_route('qris.edit');
    }

    /**
     * Public URL of the stored static QRIS image, if any.
     */
    private function imageUrl(): ?string
    {
        $path = Setting::get('qris_static_image');

        return $path ? Storage::disk('public')->url($path) : null;
    }
}
