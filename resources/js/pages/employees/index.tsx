import { Head } from '@inertiajs/react';
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
import { Users } from 'lucide-react';

type Employee = {
    id: number;
    name: string;
    email: string;
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

export default function EmployeesIndex({
    employees,
}: {
    employees: Employee[];
}) {
    return (
        <>
            <Head title="Data Pegawai" />
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Data Pegawai"
                    description="Informasi umum karyawan yang dibutuhkan HR."
                    actions={
                        <Button variant="outline" size="sm">
                            <Users aria-hidden="true" /> {employees.length} pegawai
                        </Button>
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
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Peran</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Jabatan</TableHead>
                                    <TableHead>Atasan</TableHead>
                                    <TableHead>Limit Kasbon</TableHead>
                                    <TableHead>Terpakai</TableHead>
                                    <TableHead>Sisa</TableHead>
                                    <TableHead>Bergabung</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((emp) => (
                                    <TableRow key={emp.id}>
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
                                            {emp.supervisor?.name || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {rupiah(emp.kasbon_limit)}
                                        </TableCell>
                                        <TableCell>
                                            {rupiah(emp.kasbon_used)}
                                        </TableCell>
                                        <TableCell>
                                            {rupiah(
                                                Math.max(
                                                    0,
                                                    emp.kasbon_limit -
                                                        emp.kasbon_used,
                                                ),
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {emp.created_at
                                                ? new Date(
                                                      emp.created_at,
                                                  ).toLocaleDateString('id-ID', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : '—'}
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
