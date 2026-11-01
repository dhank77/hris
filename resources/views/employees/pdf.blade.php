<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Data Pegawai</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111827;
            margin: 0;
            padding: 16px;
        }
        h1 {
            font-size: 18px;
            margin: 0 0 4px 0;
        }
        .subtitle {
            font-size: 11px;
            color: #6b7280;
            margin: 0 0 16px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        tr:nth-child(even) td {
            background-color: #f9fafb;
        }
        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <h1>Data Pegawai</h1>
    <p class="subtitle">Dicetak pada: {{ now()->format('d/m/Y H:i') }} | Total: {{ $employees->count() }} pegawai</p>

    <table>
        <thead>
            <tr>
                <th style="width: 30px;">No</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Departemen</th>
                <th>Jabatan</th>
                <th>Atasan</th>
                <th class="text-right">Limit Kasbon</th>
            </tr>
        </thead>
        <tbody>
            @php
                $roleLabels = [
                    'employee' => 'Karyawan',
                    'supervisor' => 'Supervisor',
                    'hr' => 'HR',
                    'finance' => 'Finance',
                    'admin' => 'Admin',
                ];
            @endphp
            @forelse ($employees as $index => $emp)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $emp->name }}</td>
                    <td>{{ $emp->email }}</td>
                    <td>{{ $roleLabels[$emp->role] ?? $emp->role }}</td>
                    <td>{{ $emp->department ?: '—' }}</td>
                    <td>{{ $emp->position ?: '—' }}</td>
                    <td>{{ $emp->supervisor?->name ?: '—' }}</td>
                    <td class="text-right">Rp {{ number_format((float) $emp->kasbon_limit, 0, ',', '.') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align: center;">Belum ada data pegawai.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>

