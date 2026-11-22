<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('api.auth.')->group(function (): void {
    Route::post('login', [AuthController::class, 'login'])->name('login');
    Route::post('google', [AuthController::class, 'google'])->name('google');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    });
});

Route::prefix('attendance')->name('api.attendance.')->middleware('auth:sanctum')->group(function (): void {
    Route::get('today', [AttendanceController::class, 'today'])->name('today');
    Route::get('history', [AttendanceController::class, 'history'])->name('history');
    Route::post('clock-in', [AttendanceController::class, 'clockIn'])->name('clock-in');
    Route::post('clock-out', [AttendanceController::class, 'clockOut'])->name('clock-out');
});
