<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CashAdvanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\NewsController;
use App\Http\Controllers\Webhook\QrisPaymentWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, '__invoke'])->name('home');

Route::middleware(['guest'])->group(function () {
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
});

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('news', NewsController::class)->except(['show']);

    // Employees (data pegawai)
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/create', [EmployeeController::class, 'create'])->name('employees.create');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::post('employees/import', [EmployeeController::class, 'import'])->name('employees.import');
    Route::get('employees/import/template', [EmployeeController::class, 'downloadTemplate'])->name('employees.import.template');
    Route::get('employees/export/excel', [EmployeeController::class, 'exportExcel'])->name('employees.export.excel');
    Route::get('employees/export/pdf', [EmployeeController::class, 'exportPdf'])->name('employees.export.pdf');
    Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::get('employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
    Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');

    // Attendance
    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
    Route::get('attendance/history', [AttendanceController::class, 'history'])->name('attendance.history');
    Route::get('attendance/recap', [AttendanceController::class, 'recap'])->name('attendance.recap');

    // Leave requests
    Route::get('leave-requests', [LeaveRequestController::class, 'index'])->name('leave-requests.index');
    Route::get('leave-requests/create', [LeaveRequestController::class, 'create'])->name('leave-requests.create');
    Route::post('leave-requests', [LeaveRequestController::class, 'store'])->name('leave-requests.store');
    Route::get('leave-requests/{leaveRequest}', [LeaveRequestController::class, 'show'])->name('leave-requests.show');
    Route::post('leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve'])->name('leave-requests.approve');
    Route::post('leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject'])->name('leave-requests.reject');

    // Cash advances
    Route::get('cash-advances', [CashAdvanceController::class, 'index'])->name('cash-advances.index');
    Route::get('cash-advances/create', [CashAdvanceController::class, 'create'])->name('cash-advances.create');
    Route::post('cash-advances', [CashAdvanceController::class, 'store'])->name('cash-advances.store');
    Route::get('cash-advances/{cashAdvance}', [CashAdvanceController::class, 'show'])->name('cash-advances.show');
    Route::post('cash-advances/{cashAdvance}/approve-level1', [CashAdvanceController::class, 'approveLevel1'])->name('cash-advances.approve-level1');
    Route::post('cash-advances/{cashAdvance}/approve-finance', [CashAdvanceController::class, 'approveFinance'])->name('cash-advances.approve-finance');
    Route::post('cash-advances/{cashAdvance}/reject', [CashAdvanceController::class, 'reject'])->name('cash-advances.reject');
    Route::post('cash-advances/{cashAdvance}/disburse', [CashAdvanceController::class, 'disburse'])->name('cash-advances.disburse');
    Route::post('cash-advances/installments/{installment}/pay', [CashAdvanceController::class, 'markPaid'])->name('cash-advances.installments.pay');
    Route::post('cash-advances/installments/{installment}/qris', [CashAdvanceController::class, 'qris'])->name('cash-advances.installments.qris');
    Route::post('cash-advances/deduct-payroll', [CashAdvanceController::class, 'deductPayroll'])->name('cash-advances.deduct-payroll');
});

// QRIS payment webhook (signed, outside auth)
Route::post('webhooks/qris', QrisPaymentWebhookController::class)->name('webhooks.qris');

require __DIR__.'/settings.php';
