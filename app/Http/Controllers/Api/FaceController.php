<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FaceProfile;
use App\Models\User;
use App\Services\FaceMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaceController extends Controller
{
    public function __construct(
        private readonly FaceMatchingService $faceMatching,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->faceProfile()->first();

        return response()->json([
            'registered' => $profile !== null,
            'can_reregister' => $profile === null || (bool) $profile->can_reregister,
            'face_profile' => $profile ? $this->formatProfile($profile) : null,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'embedding' => ['required', 'array', 'min:64', 'max:512'],
            'embedding.*' => ['required', 'numeric'],
            'model_version' => ['nullable', 'string', 'max:64'],
        ]);

        $user = $request->user();
        $existing = $user->faceProfile()->first();
        if ($existing !== null && ! $existing->can_reregister) {
            return response()->json([
                'message' => 'Wajah sudah terdaftar. Hubungi admin untuk mengizinkan registrasi ulang.',
            ], 403);
        }

        $normalized = $this->faceMatching->normalizeEmbedding($validated['embedding']);
        if ($normalized === null) {
            return response()->json([
                'message' => 'Embedding wajah tidak valid (vektor nol).',
            ], 422);
        }

        $profile = FaceProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'embedding' => $normalized,
                'model_version' => $validated['model_version'] ?? 'mobilefacenet',
                'can_reregister' => false,
                'registered_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Registrasi wajah berhasil disimpan.',
            'registered' => true,
            'can_reregister' => false,
            'face_profile' => $this->formatProfile($profile),
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'embedding' => ['required', 'array', 'min:64', 'max:512'],
            'embedding.*' => ['required', 'numeric'],
        ]);

        $result = $this->faceMatching->verifyAgainstProfile(
            $request->user()->faceProfile()->first(),
            $validated['embedding'],
        );

        if (! $result['ok']) {
            return response()->json([
                'message' => $result['message'],
            ], $result['status']);
        }

        return response()->json([
            'matched' => $result['matched'],
            'similarity' => $result['similarity'],
            'distance' => $result['distance'],
            'threshold' => $result['threshold'],
            'message' => $result['message'],
        ]);
    }

    public function allowReregister(Request $request, User $user): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Hanya admin yang dapat mengizinkan registrasi ulang wajah.',
            ], 403);
        }

        $profile = $user->faceProfile()->first();
        if (! $profile) {
            return response()->json([
                'message' => 'Pegawai belum memiliki data wajah terdaftar.',
            ], 422);
        }

        $profile->update(['can_reregister' => true]);

        return response()->json([
            'message' => 'Izin registrasi ulang wajah berhasil diberikan untuk '.$user->name.'.',
            'can_reregister' => true,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'message' => 'Hanya admin yang dapat menghapus data wajah terdaftar.',
            ], 403);
        }

        $request->user()->faceProfile()?->delete();

        return response()->json([
            'message' => 'Data wajah berhasil dihapus.',
            'registered' => false,
            'can_reregister' => true,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatProfile(FaceProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'model_version' => $profile->model_version,
            'can_reregister' => (bool) $profile->can_reregister,
            'registered_at' => $profile->registered_at?->toIso8601String(),
            'embedding' => array_map('floatval', $profile->embedding),
        ];
    }
}
