<?php

namespace App\Http\Controllers;

use App\Models\News;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class NewsController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        if ($request->user()?->role !== 'admin') {
            abort(403);
        }
    }

    public function index(Request $request): InertiaResponse
    {
        $this->ensureAdmin($request);

        $news = News::with('author')->latest()->paginate(15);

        return Inertia::render('news/index', [
            'news' => $news,
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        $this->ensureAdmin($request);

        return Inertia::render('news/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'published_at' => 'nullable|date',
        ]);

        News::create([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'published_at' => $validated['published_at'] ?? now(),
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('news.index');
    }

    public function edit(Request $request, News $news): InertiaResponse
    {
        $this->ensureAdmin($request);

        return Inertia::render('news/edit', [
            'news' => $news,
        ]);
    }

    public function update(Request $request, News $news): RedirectResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'published_at' => 'nullable|date',
        ]);

        $news->update([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'published_at' => $validated['published_at'] ?? $news->published_at,
        ]);

        return redirect()->route('news.index');
    }

    public function destroy(Request $request, News $news): RedirectResponse
    {
        $this->ensureAdmin($request);

        $news->delete();

        return redirect()->route('news.index');
    }
}
