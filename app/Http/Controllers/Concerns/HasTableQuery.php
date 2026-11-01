<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

trait HasTableQuery
{
    /**
     * Extract validated table query parameters (search, sort, dir) from the request.
     *
     * @param  list<string>  $sortable
     * @return array{search: string, sort: string, dir: string}
     */
    protected function tableQuery(Request $request, array $sortable, string $defaultSort, string $defaultDir = 'desc'): array
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $sort = (string) $request->query('sort', $defaultSort);
        $dir = (string) $request->query('dir', $defaultDir);

        return [
            'search' => trim((string) ($validated['search'] ?? '')),
            'sort' => in_array($sort, $sortable, true) ? $sort : $defaultSort,
            'dir' => in_array($dir, ['asc', 'desc'], true) ? $dir : $defaultDir,
        ];
    }
}
