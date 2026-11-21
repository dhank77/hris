<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = Hash::make('password');

        User::updateOrCreate(
            ['email' => 'd41113512@gmail.com'],
            [
                'name' => 'M. Hamdani Ilham Latjoro',
                'password' => $password,
                'email_verified_at' => now(),
                'role' => 'admin',
                'department' => 'Management',
                'position' => 'Administrator',
                'kasbon_limit' => 10000000,
            ]
        );

        User::updateOrCreate(
            ['email' => 'hr@example.com'],
            [
                'name' => 'HR Manager',
                'password' => $password,
                'email_verified_at' => now(),
                'role' => 'hr',
                'department' => 'Human Resources',
                'position' => 'HR Manager',
                'kasbon_limit' => 5000000,
            ]
        );

        User::updateOrCreate(
            ['email' => 'finance@example.com'],
            [
                'name' => 'Finance Staff',
                'password' => $password,
                'email_verified_at' => now(),
                'role' => 'finance',
                'department' => 'Finance',
                'position' => 'Finance Officer',
                'kasbon_limit' => 5000000,
            ]
        );

        $supervisor = User::updateOrCreate(
            ['email' => 'supervisor@example.com'],
            [
                'name' => 'Supervisor IT',
                'password' => $password,
                'email_verified_at' => now(),
                'role' => 'supervisor',
                'department' => 'IT',
                'position' => 'Engineering Lead',
                'kasbon_limit' => 5000000,
            ]
        );

        User::updateOrCreate(
            ['email' => 'employee@example.com'],
            [
                'name' => 'Pegawai Contoh',
                'password' => $password,
                'email_verified_at' => now(),
                'role' => 'employee',
                'department' => 'IT',
                'position' => 'Software Engineer',
                'supervisor_id' => $supervisor->id,
                'kasbon_limit' => 3000000,
            ]
        );

        if (User::where('role', 'employee')->count() < 5) {
            User::factory(5)->create([
                'role' => 'employee',
                'department' => 'IT',
                'position' => 'Staff',
                'supervisor_id' => $supervisor->id,
                'kasbon_limit' => 3000000,
            ]);
        }

        $this->call(DummyDataSeeder::class);
    }
}
