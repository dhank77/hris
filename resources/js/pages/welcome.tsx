import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, FileText, Wallet } from 'lucide-react';
import { dashboard, login } from '@/routes';

const stations = [
    { x: 60, label: 'Absen', y: 150 },
    { x: 220, label: 'Izin', y: 150 },
    { x: 380, label: 'Cuti', y: 150 },
    { x: 540, label: 'Kasbon', y: 150 },
];

const features = [
    {
        icon: CalendarCheck,
        title: 'Absen harian',
        text: 'Catat jam masuk dan pulang dari ponsel, riwayat kehadiran tersimpan rapi.',
    },
    {
        icon: FileText,
        title: 'Izin dan cuti',
        text: 'Ajukan, pantau persetujuan, dan lihat sisa cuti tanpa formulir kertas.',
    },
    {
        icon: Wallet,
        title: 'Kasbon',
        text: 'Ajukan kasbon dan ikuti statusnya dari pengajuan sampai disetujui.',
    },
];

function LineIllustration() {
    return (
        <svg
            viewBox="0 0 600 300"
            role="img"
            aria-label="Empat stasiun pada satu jalur: Absen, Izin, Cuti, dan Kasbon"
            className="h-auto w-full"
        >
            <path
                d="M 60 150 H 220 H 380 H 540"
                className="stroke-primary"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M 60 150 H 220 H 380 H 540"
                stroke="currentColor"
                className="text-white/30"
                strokeWidth="2"
                strokeDasharray="2 14"
                strokeLinecap="round"
                fill="none"
            />
            {stations.map((station, index) => (
                <g key={station.label}>
                    <circle
                        cx={station.x}
                        cy={station.y}
                        r="20"
                        className="fill-white stroke-sidebar-primary"
                        strokeWidth="8"
                    />
                    <text
                        x={station.x}
                        y={index % 2 === 0 ? station.y - 46 : station.y + 62}
                        textAnchor="middle"
                        className="fill-white text-[22px] font-bold"
                    >
                        {station.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;

    const primaryCta =
        'inline-flex h-12 items-center justify-center rounded-lg bg-sidebar-primary px-6 text-base font-bold text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none';
    const secondaryCta =
        'inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-6 text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar focus-visible:outline-none';

    return (
        <>
            <Head title="Absen, izin, cuti, dan kasbon dalam satu aplikasi" />
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                <section className="bg-sidebar text-sidebar-foreground">
                    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
                        <span className="text-xl font-bold tracking-tight text-white">
                            HRIS
                        </span>
                        <nav className="flex items-center gap-2 text-sm font-semibold">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex h-10 items-center rounded-lg border border-white/30 px-4 text-white transition-colors hover:bg-white/10"
                                >
                                    Dasbor
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex h-10 items-center rounded-lg border border-white/30 px-4 text-white transition-colors hover:bg-white/10"
                                >
                                    Masuk
                                </Link>
                            )}
                        </nav>
                    </header>

                    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-20 lg:grid-cols-2 lg:pt-16 lg:pb-28">
                        <div>
                            <h1 className="max-w-xl text-4xl leading-tight font-bold tracking-tight text-balance text-white sm:text-5xl">
                                Absen, izin, cuti, dan kasbon dalam satu
                                aplikasi.
                            </h1>
                            <p className="mt-5 max-w-prose text-lg text-pretty text-sidebar-foreground/80">
                                Urusan kepegawaian harian jadi jelas: dari catat
                                kehadiran sampai pengajuan disetujui, semuanya
                                terlacak di satu jalur.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className={primaryCta}
                                    >
                                        Buka dasbor
                                    </Link>
                                ) : (
                                    <Link href={login()} className={primaryCta}>
                                        Masuk ke sistem
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/15 p-4 sm:p-6">
                            <LineIllustration />
                        </div>
                    </div>
                </section>

                <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
                    <h2 className="max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                        Satu aplikasi untuk urusan harian karyawan
                    </h2>
                    <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
                        {features.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="flex gap-4">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Icon className="size-5" aria-hidden />
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {title}
                                    </h3>
                                    <p className="mt-1 text-muted-foreground">
                                        {text}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </main>
            </div>
        </>
    );
}
