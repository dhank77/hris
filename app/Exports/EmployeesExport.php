<?php

namespace App\Exports;

use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * @implements FromCollection<int, User>
 * @implements WithMapping<User>
 */
class EmployeesExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping
{
    /**
     * @return Collection<int, User>
     */
    public function collection(): Collection
    {
        return User::with('supervisor')->orderBy('name')->get();
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Nama',
            'Email',
            'Peran',
            'Departemen',
            'Jabatan',
            'Atasan',
            'Limit Kasbon',
            'Kasbon Terpakai',
        ];
    }

    /**
     * @param  User  $row
     * @return array<int, string|float>
     */
    public function map(mixed $row): array
    {
        return [
            $row->name,
            $row->email,
            $row->role,
            $row->department ?? '',
            $row->position ?? '',
            $row->supervisor?->name ?? '',
            (float) $row->kasbon_limit,
            (float) $row->kasbon_used,
        ];
    }
}

