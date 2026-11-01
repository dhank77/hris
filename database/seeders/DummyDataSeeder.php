<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\CashAdvance;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DummyDataSeeder extends Seeder
{
    private const TOTAL = 100;

    /**
     * Seed 100 attendance, leave request and cash advance records spread across employees.
     */
    public function run(): void
    {
        Model::unguard();

        $employees = User::where('role', 'employee')->get();
        $approvers = User::whereIn('role', ['admin', 'hr', 'finance'])->get();

        if ($employees->isEmpty() || $approvers->isEmpty()) {
            $this->command?->warn('Butuh minimal satu pegawai dan satu admin/hr/finance.');

            return;
        }

        $this->seedAttendances($employees);
        $this->seedLeaveRequests($employees, $approvers);
        $this->seedCashAdvances($employees, $approvers);

        Model::reguard();
    }

    /**
     * @param  Collection<int, User>  $employees
     */
    private function seedAttendances(Collection $employees): void
    {
        $count = 0;
        $dayOffset = 0;

        while ($count < self::TOTAL) {
            $date = Carbon::today()->subDays($dayOffset++);
            foreach ($employees as $employee) {
                if ($count >= self::TOTAL) {
                    break;
                }

                $status = fake()->randomElement(['present', 'present', 'present', 'late', 'absent', 'leave', 'sick', 'permission']);
                $worked = in_array($status, ['present', 'late']);
                $lateMinutes = $status === 'late' ? fake()->numberBetween(5, 60) : 0;

                Attendance::updateOrCreate(
                    ['user_id' => $employee->id, 'date' => $date->toDateString()],
                    [
                        'clock_in_at' => $worked ? $date->copy()->setTime(8, 0)->addMinutes($lateMinutes) : null,
                        'clock_out_at' => $worked ? $date->copy()->setTime(17, fake()->numberBetween(0, 30)) : null,
                        'status' => $status,
                        'late_minutes' => $lateMinutes,
                        'notes' => 'Data dummy',
                    ]
                );
                $count++;
            }
        }
    }

    /**
     * @param  Collection<int, User>  $employees
     * @param  Collection<int, User>  $approvers
     */
    private function seedLeaveRequests(Collection $employees, Collection $approvers): void
    {
        for ($i = 0; $i < self::TOTAL; $i++) {
            $start = Carbon::today()->addDays(fake()->numberBetween(-60, 30));
            $status = fake()->randomElement(['pending', 'approved', 'rejected']);
            $decided = $status !== 'pending';

            LeaveRequest::create([
                'user_id' => $employees->random()->id,
                'type' => fake()->randomElement(['leave', 'sick', 'permission']),
                'start_date' => $start->toDateString(),
                'end_date' => $start->copy()->addDays(fake()->numberBetween(0, 4))->toDateString(),
                'reason' => fake()->sentence(),
                'status' => $status,
                'approved_by' => $decided ? $approvers->random()->id : null,
                'approved_at' => $decided ? now() : null,
                'rejection_reason' => $status === 'rejected' ? fake()->sentence() : null,
            ]);
        }
    }

    /**
     * @param  Collection<int, User>  $employees
     * @param  Collection<int, User>  $approvers
     */
    private function seedCashAdvances(Collection $employees, Collection $approvers): void
    {
        $statuses = ['pending', 'approved_level1', 'approved_finance', 'rejected', 'disbursed', 'completed'];

        for ($i = 0; $i < self::TOTAL; $i++) {
            $status = fake()->randomElement($statuses);
            $tenor = fake()->randomElement([2, 3, 4, 6]);
            $amount = fake()->numberBetween(5, 30) * 100000;
            $installment = round($amount / $tenor, 2);

            $level1 = in_array($status, ['approved_level1', 'approved_finance', 'disbursed', 'completed']);
            $finance = in_array($status, ['approved_finance', 'disbursed', 'completed']);
            $disbursed = in_array($status, ['disbursed', 'completed']);

            $cashAdvance = CashAdvance::create([
                'user_id' => $employees->random()->id,
                'amount' => $amount,
                'reason' => fake()->sentence(),
                'tenor_months' => $tenor,
                'installment_amount' => $installment,
                'status' => $status,
                'approved_level1_by' => $level1 ? $approvers->random()->id : null,
                'approved_level1_at' => $level1 ? now()->subDays(5) : null,
                'approved_finance_by' => $finance ? $approvers->random()->id : null,
                'approved_finance_at' => $finance ? now()->subDays(4) : null,
                'rejection_reason' => $status === 'rejected' ? fake()->sentence() : null,
                'disbursed_at' => $disbursed ? now()->subDays(3) : null,
            ]);

            if (! $disbursed) {
                continue;
            }

            for ($period = 1; $period <= $tenor; $period++) {
                $paid = $status === 'completed' || ($period === 1 && fake()->boolean());

                $cashAdvance->installments()->create([
                    'period_number' => $period,
                    'due_date' => now()->addMonths($period)->toDateString(),
                    'amount' => $installment,
                    'paid' => $paid,
                    'paid_at' => $paid ? now() : null,
                ]);
            }
        }
    }
}
