<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => __('Email atau password salah.'),
            ], 401);
        }

        $deviceName = $validated['device_name'] ?? 'flutter-hris';
        $accessToken = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ]);
    }

    public function google(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_token' => ['nullable', 'string', 'required_without:access_token'],
            'access_token' => ['nullable', 'string', 'required_without:id_token'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $googleToken = (string) ($validated['id_token'] ?? $validated['access_token']);

        try {
            $googleUser = $this->resolveGoogleUser($googleToken);
        } catch (\Throwable $e) {
            Log::error('Google API Auth error: '.$e->getMessage());

            return response()->json([
                'message' => __('Gagal memverifikasi akun Google. Silakan coba lagi.'),
            ], 401);
        }

        $googleId = $googleUser->getId();
        $email = $googleUser->getEmail();

        if (! $googleId && ! $email) {
            return response()->json([
                'message' => __('Akun Google Anda tidak memiliki identitas atau email yang valid.'),
            ], 422);
        }

        $user = null;
        if ($googleId) {
            $user = User::where('google_id', $googleId)->first();
        }
        if (! $user && $email) {
            $user = User::where('email', $email)->first();
        }

        if (! $user) {
            return response()->json([
                'message' => __('Akun Google Anda belum terdaftar sebagai pegawai. Silakan hubungi admin atau HR.'),
            ], 403);
        }

        if ($user->google_id && $googleId && $user->google_id !== $googleId) {
            return response()->json([
                'message' => __('Akun pegawai ini sudah tertaut dengan akun Google yang berbeda.'),
            ], 403);
        }

        $updates = [];
        if (! $user->google_id && $googleId) {
            $updates['google_id'] = $googleId;
        }
        if (! $user->avatar && $googleUser->getAvatar()) {
            $updates['avatar'] = $googleUser->getAvatar();
        }
        if (! $user->email_verified_at) {
            $updates['email_verified_at'] = now();
        }

        if (! empty($updates)) {
            $user->update($updates);
        }

        $deviceName = $validated['device_name'] ?? 'flutter-hris';
        $accessToken = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'user' => $this->formatUser($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->currentAccessToken()?->delete();

        return response()->json([
            'message' => __('Berhasil keluar.'),
        ]);
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     email: string,
     *     avatar: string|null,
     *     role: string,
     *     department: string|null,
     *     position: string|null
     * }
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $user->role ?? 'employee',
            'department' => $user->department,
            'position' => $user->position,
        ];
    }

    private function resolveGoogleUser(string $googleToken): \Laravel\Socialite\Contracts\User
    {
        try {
            return Socialite::driver('google')->userFromToken($googleToken);
        } catch (\Throwable $primaryException) {
            $mobileClientId = config('services.google.mobile_client_id');
            if (
                ! is_string($mobileClientId)
                || $mobileClientId === ''
                || $mobileClientId === config('services.google.client_id')
                || ! str_contains($primaryException->getMessage(), 'Invalid ID token audience')
            ) {
                throw $primaryException;
            }

            config(['services.google.client_id' => $mobileClientId]);
            Socialite::forgetDrivers();

            return Socialite::driver('google')->userFromToken($googleToken);
        }
    }
}
