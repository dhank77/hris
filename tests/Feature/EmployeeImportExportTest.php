<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Excel as BaseExcel;
use Maatwebsite\Excel\Facades\Excel;

test('non-admin users cannot import or export employees', function () {
    $employee = User::factory()->create(['role' => 'employee']);

    $this->actingAs($employee)
        ->get(route('employees.export.excel'))
        ->assertForbidden();

    $this->actingAs($employee)
        ->get(route('employees.export.pdf'))
        ->assertForbidden();

    $this->actingAs($employee)
        ->post(route('employees.import'), [
            'file' => UploadedFile::fake()->create('employees.xls', 10),
        ])
        ->assertForbidden();
});

test('admin can export employees to xls', function () {
    $admin = User::factory()->create([
        'name' => 'Admin HRIS',
        'email' => 'admin@example.com',
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get(route('employees.export.excel'));

    $response->assertOk();
    $response->assertDownload('data-pegawai.xls');
});

test('admin can export employees to pdf', function () {
    $admin = User::factory()->create([
        'name' => 'Admin HRIS',
        'email' => 'admin@example.com',
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->get(route('employees.export.pdf'));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    expect($response->headers->get('content-disposition'))->toContain('data-pegawai.pdf');
});

test('admin can import employees from xls file', function () {
    $admin = User::factory()->create([
        'name' => 'Supervisor Utama',
        'email' => 'supervisor@example.com',
        'role' => 'admin',
    ]);

    $export = new class implements FromArray, WithHeadings
    {
        public function headings(): array
        {
            return ['Nama', 'Email', 'Password', 'Peran', 'Departemen', 'Jabatan', 'Atasan', 'Limit Kasbon'];
        }

        public function array(): array
        {
            return [
                ['Budi Santoso', 'budi@example.com', 'secret123', 'Karyawan', 'Engineering', 'Backend Developer', 'Supervisor Utama', 5000000],
                ['Siti Aminah', 'siti@example.com', 'secret123', 'hr', 'Human Resources', 'HR Specialist', 'supervisor@example.com', 3000000],
            ];
        }
    };

    $rawXls = Excel::raw($export, BaseExcel::XLS);
    $file = UploadedFile::fake()->createWithContent('import-pegawai.xls', $rawXls);

    $response = $this->actingAs($admin)->post(route('employees.import'), [
        'file' => $file,
    ]);

    $response->assertRedirect(route('employees.index'));

    $budi = User::where('email', 'budi@example.com')->first();
    expect($budi)->not->toBeNull()
        ->and($budi->name)->toBe('Budi Santoso')
        ->and($budi->role)->toBe('employee')
        ->and($budi->department)->toBe('Engineering')
        ->and($budi->position)->toBe('Backend Developer')
        ->and($budi->supervisor_id)->toBe($admin->id)
        ->and((float) $budi->kasbon_limit)->toBe(5000000.0);

    $siti = User::where('email', 'siti@example.com')->first();
    expect($siti)->not->toBeNull()
        ->and($siti->name)->toBe('Siti Aminah')
        ->and($siti->role)->toBe('hr')
        ->and($siti->supervisor_id)->toBe($admin->id);
});

test('admin import returns validation error when row data is invalid', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $export = new class implements FromArray, WithHeadings
    {
        public function headings(): array
        {
            return ['Nama', 'Email', 'Peran'];
        }

        public function array(): array
        {
            return [
                ['Tanpa Email Valid', 'bukan-email', 'employee'],
            ];
        }
    };

    $rawXls = Excel::raw($export, BaseExcel::XLS);
    $file = UploadedFile::fake()->createWithContent('invalid-pegawai.xls', $rawXls);

    $response = $this->actingAs($admin)->post(route('employees.import'), [
        'file' => $file,
    ]);

    $response->assertSessionHasErrors('file');
});
