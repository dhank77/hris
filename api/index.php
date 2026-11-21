<?php

declare(strict_types=1);

// Ensure writable storage directories exist on Vercel's ephemeral /tmp filesystem.
if (getenv('VERCEL') || isset($_ENV['VERCEL'])) {
    $tmpStorage = '/tmp/storage';
    foreach ([
        $tmpStorage.'/framework/cache/data',
        $tmpStorage.'/framework/sessions',
        $tmpStorage.'/framework/views',
        $tmpStorage.'/logs',
    ] as $dir) {
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

require __DIR__.'/../public/index.php';
