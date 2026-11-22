<?php

namespace App\Services;

use App\Models\FaceProfile;

class FaceMatchingService
{
    public const SIMILARITY_THRESHOLD = 0.75;

    /**
     * @param  array<int, mixed>  $raw
     * @return array<int, float>|null
     */
    public function normalizeEmbedding(array $raw): ?array
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
     * @param  array<int, mixed>  $rawCandidate
     * @return array{ok: bool, status: int, matched: bool, similarity?: float, distance?: float, threshold?: float, message: string}
     */
    public function verifyAgainstProfile(?FaceProfile $profile, array $rawCandidate): array
    {
        if (! $profile) {
            return [
                'ok' => false,
                'status' => 422,
                'matched' => false,
                'message' => 'Wajah belum terdaftar. Silakan lakukan registrasi wajah terlebih dahulu.',
            ];
        }

        $candidate = $this->normalizeEmbedding($rawCandidate);
        if ($candidate === null) {
            return [
                'ok' => false,
                'status' => 422,
                'matched' => false,
                'message' => 'Embedding wajah tidak valid.',
            ];
        }

        $stored = array_map('floatval', $profile->embedding);
        if (count($candidate) !== count($stored)) {
            return [
                'ok' => false,
                'status' => 422,
                'matched' => false,
                'message' => 'Dimensi embedding wajah tidak sesuai dengan data terdaftar.',
            ];
        }

        $similarity = $this->cosineSimilarity($stored, $candidate);
        $distance = $this->euclideanDistance($stored, $candidate);
        $matched = $similarity >= self::SIMILARITY_THRESHOLD;

        return [
            'ok' => true,
            'status' => 200,
            'matched' => $matched,
            'similarity' => round($similarity, 4),
            'distance' => round($distance, 4),
            'threshold' => self::SIMILARITY_THRESHOLD,
            'message' => $matched
                ? 'Wajah cocok dan berhasil diverifikasi.'
                : 'Wajah tidak cocok dengan data yang terdaftar.',
        ];
    }

    /**
     * @param  array<int, float>  $a
     * @param  array<int, float>  $b
     */
    public function cosineSimilarity(array $a, array $b): float
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
    public function euclideanDistance(array $a, array $b): float
    {
        $sum = 0.0;
        $count = count($a);
        for ($i = 0; $i < $count; $i++) {
            $diff = $a[$i] - $b[$i];
            $sum += $diff * $diff;
        }

        return sqrt($sum);
    }
}
