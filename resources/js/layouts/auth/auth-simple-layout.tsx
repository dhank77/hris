import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const stops = [
    { label: 'Absen', x: 40 },
    { label: 'Izin/Cuti', x: 130 },
    { label: 'Kasbon', x: 220 },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
                <Link href={home()} className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <AppLogoIcon className="size-6 fill-current" />
                    </span>
                    <span className="text-xl font-bold tracking-wide">
                        HRIS
                    </span>
                </Link>

                <div className="grid max-w-md gap-8">
                    <h2 className="text-4xl leading-tight font-bold text-sidebar-accent-foreground">
                        Satu jalur untuk semua urusan kerja Anda.
                    </h2>
                    <svg
                        viewBox="0 0 260 64"
                        role="img"
                        aria-label="Tiga layanan: absen, izin atau cuti, dan kasbon"
                        className="w-full max-w-sm"
                    >
                        <rect
                            x="40"
                            y="18"
                            width="180"
                            height="6"
                            rx="3"
                            className="fill-sidebar-primary"
                        />
                        {stops.map((stop) => (
                            <g key={stop.label}>
                                <circle
                                    cx={stop.x}
                                    cy="21"
                                    r="11"
                                    className="fill-sidebar stroke-sidebar-primary"
                                    strokeWidth="5"
                                />
                                <text
                                    x={stop.x}
                                    y="55"
                                    textAnchor="middle"
                                    className="fill-sidebar-foreground text-[11px] font-semibold"
                                >
                                    {stop.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>

                <p className="text-sm text-sidebar-foreground/70">
                    Kehadiran, izin, dan kasbon dalam satu aplikasi.
                </p>
            </aside>

            <main className="flex flex-col items-center justify-center gap-8 p-6 md:p-12">
                <Link href={home()} className="flex items-center gap-2 lg:hidden">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar text-sidebar-primary">
                        <AppLogoIcon className="size-6 fill-current" />
                    </span>
                    <span className="text-xl font-bold tracking-wide">HRIS</span>
                </Link>

                <div className="flex w-full max-w-sm flex-col gap-8">
                    <div className="grid gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
