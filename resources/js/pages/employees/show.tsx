import { Head, Link, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import {
    show as empShow,
    edit as empEdit,
    index as empIndex,
} from '@/routes/employees';

type Employee = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role: string;
    department?: string | null;
    position?: string | null;
    supervisor?: { id: number; name: string } | null;
    kasbon_limit: number;
    kasbon_used: number;
    created_at?: string | null;
};

const roleLabel: Record<string, string> = {
    employee: 'Karyawan',
    supervisor: 'Supervisor',
    hr: 'HR',
    finance: 'Finance',
    admin: 'Admin',
};

const rupiah = (value: number | string) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function EmployeesShow({ employee }: { employee: Employee }) {
    const page = usePage();
    const auth = (page.props as { auth?: { user?: { role?: string } } }).auth;
    const isAdmin = auth?.user?.role === 'admin';
    const isEmployee = auth?.user?.role === 'employee';

    const initials = employee.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title={`Detail Pegawai - ${employee.name}`} />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Detail Pegawai"
                    description="Informasi lengkap karyawan."
                    actions={
                        <>
                            {isAdmin && (
                                <Button asChild size="sm">
                                    <Link
                                        href={empEdit.url({
                                            employee: employee.id,
                                        })}
                                    >
                                        <Pencil aria-hidden="true" /> Ubah
                                    </Link>
                                </Button>
                            )}
                            {!isEmployee && (
                                <Button asChild size="sm" variant="outline">
                                    <Link href={empIndex.url()}>Kembali</Link>
                                </Button>
                            )}
                        </>
                    }
                />

                <section className="grid gap-6 rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-4">
                        {employee.avatar ? (
                            <img
                                src={`/storage/${employee.avatar}`}
                                alt={employee.name}
                                className="h-20 w-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-xl font-semibold">
                                {initials}
                            </div>
                        )}
                        <div className="grid gap-1">
                            <h2 className="text-xl font-bold">
                                {employee.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {employee.email}
                            </p>
                            <span className="inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                {roleLabel[employee.role] ?? employee.role}
                            </span>
                        </div>
                    </div>

                    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Departemen
                            </dt>
                            <dd className="font-medium">
                                {employee.department || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Jabatan
                            </dt>
                            <dd className="font-medium">
                                {employee.position || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Atasan
                            </dt>
                            <dd className="font-medium">
                                {employee.supervisor?.name || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Bergabung
                            </dt>
                            <dd className="font-medium">
                                {employee.created_at
                                    ? new Date(
                                          employee.created_at,
                                      ).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Limit Kasbon
                            </dt>
                            <dd className="tabular font-medium">
                                {rupiah(employee.kasbon_limit)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Terpakai
                            </dt>
                            <dd className="tabular font-medium">
                                {rupiah(employee.kasbon_used)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Sisa Limit
                            </dt>
                            <dd className="tabular font-medium">
                                {rupiah(
                                    Math.max(
                                        0,
                                        employee.kasbon_limit -
                                            employee.kasbon_used,
                                    ),
                                )}
                            </dd>
                        </div>
                    </dl>
                </section>
            </div>
        </>
    );
}
