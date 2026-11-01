<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EmployeeController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $query = User::with('supervisor')->orderBy('name');

        if (! in_array($user->role, ['hr', 'admin'])) {
            if ($user->role === 'supervisor') {
                $subIds = User::where('supervisor_id', $user->id)->pluck('id');
                $query->whereIn('id', $subIds->push($user->id));
            } else {
                $query->where('id', $user->id);
            }
        }

        return Inertia::render('employees/index', [
            'employees' => $query->get(),
        ]);
    }
}
