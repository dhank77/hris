<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeesTemplateExport implements FromArray, ShouldAutoSize, WithHeadings, WithStyles
{
    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Nama',
            'Email',
            'Password',
            'Peran',
            'Departemen',
            'Jabatan',
            'Atasan',
            'Limit Kasbon',
        ];
    }

    /**
     * @return array<int, array<int, string|int>>
     */
    public function array(): array
    {
        return [
            [
                'Budi Santoso',
                'budi.santoso@example.com',
                'password123',
                'Karyawan',
                'Engineering',
                'Software Engineer',
                '',
                5000000,
            ],
            [
                'Siti Aminah',
                'siti.aminah@example.com',
                'password123',
                'HR',
                'Human Resources',
                'HR Specialist',
                'budi.santoso@example.com',
                3000000,
            ],
        ];
    }

    /**
     * @return array<int, array<string, array<string, bool>>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
