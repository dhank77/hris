<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
}
