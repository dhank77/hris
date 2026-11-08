<?php

namespace App\Http\Controllers;

use App\Models\News;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class HomeController extends Controller
{
    public function __invoke(Request $request): InertiaResponse
    {
        $news = News::whereNotNull('published_at')
            ->latest('published_at')
            ->limit(6)
            ->get(['id', 'title', 'body', 'published_at']);

        return Inertia::render('welcome', [
            'news' => $news,
        ]);
    }
}
