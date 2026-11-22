<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FaceProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaceController extends Controller
{
    private const SIMILARITY_THRESHOLD = 0.75;

    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->faceProfile;

        return response()->json([
            'registered' => $profile !== null,
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

        $normalized = $this->normalizeEmbedding($validated['embedding']);
        if ($normalized === null) {
            return response()->json([
                'message' => 'Embedding wajah tidak valid (vektor nol).',
            ], 422);
        }

        $user = $request->user();
        $profile = FaceProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'embedding' => $normalized,
                'model_version' => $validated['model_version'] ?? 'mobilefacenet',
                'registered_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Registrasi wajah berhasil disimpan.',
            'registered' => true,
            'face_profile' => $this->formatProfile($profile),
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'embedding' => ['required', 'array', 'min:64', 'max:512'],
            'embedding.*' => ['required', 'numeric'],
        ]);

        $profile = $request->user()->faceProfile;
        if (! $profile) {
            return response()->json([
                'message' => 'Wajah belum terdaftar. Silakan lakukan registrasi wajah terlebih dahulu.',
            ], 422);
        }

        $candidate = $this->normalizeEmbedding($validated['embedding']);
        if ($candidate === null) {
            return response()->json([
                'message' => 'Embedding wajah tidak valid.',
            ], 422);
        }

        $stored = array_map('floatval', $profile->embedding);
        if (count($candidate) !== count($stored)) {
            return response()->json([
                'message' => 'Dimensi embedding wajah tidak sesuai dengan data terdaftar.',
            ], 422);
        }

        $similarity = $this->cosineSimilarity($stored, $candidate);
        $distance = $this->euclideanDistance($stored, $candidate);
        $matched = $similarity >= self::SIMILARITY_THRESHOLD;

        return response()->json([
            'matched' => $matched,
            'similarity' => round($similarity, 4),
            'distance' => round($distance, 4),
            'threshold' => self::SIMILARITY_THRESHOLD,
            'message' => $matched
                ? 'Wajah cocok dan berhasil diverifikasi.'
                : 'Wajah tidak cocok dengan data yang terdaftar.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->faceProfile()?->delete();

        return response()->json([
            'message' => 'Data wajah berhasil dihapus.',
            'registered' => false,
        ]);
    }

    /**
     * @param  array<int, mixed>  $raw
     * @return array<int, float>|null
     */
    private function normalizeEmbedding(array $raw): ?array
    {
        $values = array_map('floatval', array_values($raw));
        $sumSquares = 0.0;
        foreach ($values as $v) {
            $sumSquares += $v * $v;
        }
        $norm = sqrt($sumSquares);
        if ($norm <= 1e-12) {
            return null;
        }

        return array_map(static fn (float $v): float => $v / $norm, $values);
    }

    /**
     * @param  array<int, float>  $a
     * @param  array<int, float>  $b
     */
    private function cosineSimilarity(array $a, array $b): float
    {
        $dot = 0.0;
        $normA = 0.0;
        $normB = 0.0;
        $count = count($a);
        for ($i = 0; $i < $count; $i++) {
            $dot += $a[$i] * $b[$i];
            $normA += $a[$i] * $a[$i];
            $normB += $b[$i] * $b[$i];
        }
        $denom = sqrt($normA) * sqrt($normB);

        return $denom > 1e-12 ? $dot / $denom : 0.0;
    }

    /**
     * @param  array<int, float>  $a
     * @param  array<int, float>  $b
     */
    private function euclideanDistance(array $a, array $b): float
    {
        $sum = 0.0;
        $count = count($a);
        for ($i = 0; $i < $count; $i++) {
            $diff = $a[$i] - $b[$i];
            $sum += $diff * $diff;
        }

        return sqrt($sum);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatProfile(FaceProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'model_version' => $profile->model_version,
            'registered_at' => $profile->registered_at?->toIso8601String(),
            'embedding' => array_map('floatval', $profile->embedding),
        ];
    }
}
