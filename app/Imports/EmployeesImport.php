<?php

namespace App\Imports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class EmployeesImport implements SkipsEmptyRows, ToModel, WithHeadingRow, WithValidation
{
    /**
     * @param  array<string, mixed>  $row
     */
    public function isEmptyWhen(array $row): bool
    {
        $name = trim((string) ($row['name'] ?? $row['nama'] ?? ''));
        $email = trim((string) ($row['email'] ?? ''));

        return $name === '' && $email === '';
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function prepareForValidation(array $data, int $index): array
    {
        $name = $data['name'] ?? $data['nama'] ?? null;
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;
        $rawRole = strtolower(trim((string) ($data['role'] ?? $data['peran'] ?? 'employee')));
        $department = $data['department'] ?? $data['departemen'] ?? null;
        $position = $data['position'] ?? $data['jabatan'] ?? null;
        $supervisor = $data['supervisor_id'] ?? $data['supervisor_email'] ?? $data['email_atasan'] ?? $data['supervisor'] ?? $data['atasan'] ?? null;
        $kasbonLimit = $data['kasbon_limit'] ?? $data['limit_kasbon'] ?? 0;

        if (is_string($kasbonLimit) && ! is_numeric($kasbonLimit)) {
            $cleanedLimit = preg_replace('/[^0-9-]/', '', $kasbonLimit);
            $kasbonLimit = $cleanedLimit !== '' ? (float) $cleanedLimit : $kasbonLimit;
        }

        $roleMap = [
            'karyawan' => 'employee',
            'pegawai' => 'employee',
            'staff' => 'employee',
            'employee' => 'employee',
            'supervisor' => 'supervisor',
            'atasan' => 'supervisor',
            'hr' => 'hr',
            'hrd' => 'hr',
            'finance' => 'finance',
            'keuangan' => 'finance',
            'admin' => 'admin',
            'administrator' => 'admin',
            '' => 'employee',
        ];

        return [
            'name' => is_string($name) ? trim($name) : $name,
            'email' => is_string($email) ? strtolower(trim($email)) : $email,
            'password' => $password !== null && $password !== '' ? (string) $password : null,
            'role' => $roleMap[$rawRole] ?? $rawRole,
            'department' => $department !== null && $department !== '' ? trim((string) $department) : null,
            'position' => $position !== null && $position !== '' ? trim((string) $position) : null,
            'supervisor' => $supervisor !== null && $supervisor !== '' ? trim((string) $supervisor) : null,
            'kasbon_limit' => $kasbonLimit !== null && $kasbonLimit !== '' ? $kasbonLimit : 0,
        ];
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string'],
            'role' => ['required', 'in:employee,supervisor,hr,finance,admin'],
            'department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'kasbon_limit' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @param  array<array-key, mixed>  $row
     */
    public function model(array $row): ?User
    {
        $supervisorId = null;
        if (! empty($row['supervisor'])) {
            $supervisorValue = (string) $row['supervisor'];
            $supervisor = User::query()
                ->when(
                    is_numeric($supervisorValue),
                    fn ($q) => $q->where('id', (int) $supervisorValue),
                    fn ($q) => $q->where('email', $supervisorValue)->orWhere('name', $supervisorValue)
                )
                ->first();
            $supervisorId = $supervisor?->id;
        }

        $user = User::firstOrNew(['email' => (string) $row['email']]);
        $user->name = (string) $row['name'];
        $user->role = (string) ($row['role'] ?? 'employee');
        $user->department = $row['department'] ?? null;
        $user->position = $row['position'] ?? null;
        $user->supervisor_id = $supervisorId;
        $user->kasbon_limit = $row['kasbon_limit'] ?? 0;

        if (! $user->exists) {
            $user->kasbon_used = 0;
            $user->password = ! empty($row['password']) ? (string) $row['password'] : 'password';
        } elseif (! empty($row['password'])) {
            $user->password = (string) $row['password'];
        }

        return $user;
    }
}
