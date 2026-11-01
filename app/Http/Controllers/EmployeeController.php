<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EmployeeController extends Controller
{
    public function index(Request $request): InertiaResponse|RedirectResponse
    {
        $user = $request->user();

        if ($user->role === 'employee') {
            return $this->show($request, $user);
        }

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

    public function show(Request $request, User $employee): InertiaResponse
    {
        $user = $request->user();

        if ($employee->id !== $user->id && ! in_array($user->role, ['hr', 'admin', 'supervisor'])) {
            abort(403);
        }
        if ($user->role === 'supervisor' && $employee->id !== $user->id && $employee->supervisor_id !== $user->id) {
            abort(403);
        }

        return Inertia::render('employees/show', [
            'employee' => $employee->load('supervisor'),
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        return Inertia::render('employees/create', [
            'supervisors' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'avatar' => 'nullable|image|max:4096',
            'role' => 'required|in:employee,supervisor,hr,finance,admin',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'supervisor_id' => 'nullable|exists:users,id',
            'kasbon_limit' => 'nullable|numeric|min:0',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'avatar' => $avatarPath,
            'role' => $validated['role'],
            'department' => $validated['department'] ?? null,
            'position' => $validated['position'] ?? null,
            'supervisor_id' => $validated['supervisor_id'] ?? null,
            'kasbon_limit' => $validated['kasbon_limit'] ?? 0,
            'kasbon_used' => 0,
        ]);

        return redirect()->route('employees.index');
    }

    public function edit(Request $request, User $employee): InertiaResponse
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        return Inertia::render('employees/edit', [
            'employee' => $employee->load('supervisor'),
            'supervisors' => User::where('id', '!=', $employee->id)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, User $employee): RedirectResponse
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$employee->id,
            'password' => 'nullable|string|min:8|confirmed',
            'avatar' => 'nullable|image|max:4096',
            'role' => 'required|in:employee,supervisor,hr,finance,admin',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'supervisor_id' => 'nullable|exists:users,id',
            'kasbon_limit' => 'nullable|numeric|min:0',
        ]);

        if ($request->hasFile('avatar')) {
            if ($employee->avatar) {
                Storage::disk('public')->delete($employee->avatar);
            }
            $employee->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        $employee->name = $validated['name'];
        $employee->email = $validated['email'];
        $employee->role = $validated['role'];
        $employee->department = $validated['department'] ?? null;
        $employee->position = $validated['position'] ?? null;
        $employee->supervisor_id = $validated['supervisor_id'] ?? null;
        $employee->kasbon_limit = $validated['kasbon_limit'] ?? 0;

        if (! empty($validated['password'])) {
            $employee->password = $validated['password'];
        }

        $employee->save();

        return redirect()->route('employees.show', $employee);
    }
}
