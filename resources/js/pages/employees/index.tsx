import { Head, Link, usePage } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Users, Plus, Pencil, Eye } from 'lucide-react';
import { index as empIndex, show as empShow, edit as empEdit, create as empCreate } from '@/routes/employees';

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

export default function EmployeesIndex({
    employees,
}: {
    employees: Employee[];
}) {
    const page = usePage();
    const auth = (page.props as { auth?: { user?: { role?: string } } }).auth;
    const isAdmin = auth?.user?.role === 'admin';

    return (
        <>
            <Head title="Data Pegawai" />
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Data Pegawai"
                    description="Informasi umum karyawan yang dibutuhkan HR."
                    actions={
                        <>
                            {isAdmin && (
                                <Button asChild size="sm">
                                    <Link href={empCreate.url()}>
                                        <Plus aria-hidden="true" /> Tambah pegawai
                                    </Link>
                                </Button>
                            )}
                            <Button variant="outline" size="sm">
                                <Users aria-hidden="true" /> {employees.length} pegawai
                            </Button>
                        </>
                    }
                />

                {employees.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Belum ada data pegawai.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Foto</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Peran</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            {emp.avatar ? (
                                                <img
                                                    src={`/storage/${emp.avatar}`}
                                                    alt={emp.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                    {emp.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {emp.name}
                                        </TableCell>
                                        <TableCell>{emp.email}</TableCell>
                                        <TableCell>
                                            {roleLabel[emp.role] ?? emp.role}
                                        </TableCell>
                                        <TableCell>
                                            {emp.department || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {emp.position || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Link
                                                        href={empShow.url({
                                                            employee: emp.id,
                                                        })}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {isAdmin && (
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link
                                                            href={empEdit.url({
                                                                employee:
                                                                    emp.id,
                                                            })}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </>
    );
}
