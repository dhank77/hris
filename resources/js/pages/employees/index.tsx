import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Users, Plus, Pencil, Eye, Upload, FileSpreadsheet, FileText, Download } from 'lucide-react';
import {
    show as empShow,
    edit as empEdit,
    create as empCreate,
    importMethod as empImport,
} from '@/routes/employees';
import { excel as exportExcel, pdf as exportPdf } from '@/routes/employees/export';
import { template as importTemplate } from '@/routes/employees/import';

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
    const [importOpen, setImportOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        file: null as File | null,
    });

    const submitImport = (e: React.FormEvent) => {
        e.preventDefault();
        post(empImport.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setImportOpen(false);
            },
        });
    };

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
                                <>
                                    <Dialog
                                        open={importOpen}
                                        onOpenChange={(open) => {
                                            setImportOpen(open);
                                            if (!open) {
                                                reset();
                                                clearErrors();
                                            }
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Upload aria-hidden="true" /> Import XLS
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Import Data Pegawai</DialogTitle>
                                                <DialogDescription>
                                                    Gunakan template resmi agar format kolom sesuai dan data tidak bermasalah saat diimpor.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                                                <div className="grid gap-0.5">
                                                    <span className="font-medium">Template Import Pegawai (.xls)</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Kolom: Nama, Email, Password, Peran, Departemen, Jabatan, Atasan, Limit Kasbon
                                                    </span>
                                                </div>
                                                <Button asChild variant="secondary" size="sm">
                                                    <a href={importTemplate.url()}>
                                                        <Download aria-hidden="true" /> Unduh Template
                                                    </a>
                                                </Button>
                                            </div>
                                            <form onSubmit={submitImport} className="grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="import-file">File Excel (.xls, .xlsx, .csv)</Label>
                                                    <Input
                                                        id="import-file"
                                                        type="file"
                                                        accept=".xls,.xlsx,.csv"
                                                        onChange={(e) =>
                                                            setData('file', e.target.files?.[0] ?? null)
                                                        }
                                                    />
                                                    <InputError message={errors.file} />
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setImportOpen(false)}
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing || !data.file}
                                                    >
                                                        {processing ? 'Mengimpor...' : 'Import'}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    <Button asChild variant="outline" size="sm">
                                        <a href={exportExcel.url()}>
                                            <FileSpreadsheet aria-hidden="true" /> Export XLS
                                        </a>
                                    </Button>

                                    <Button asChild variant="outline" size="sm">
                                        <a href={exportPdf.url()}>
                                            <FileText aria-hidden="true" /> Export PDF
                                        </a>
                                    </Button>

                                    <Button asChild size="sm">
                                        <Link href={empCreate.url()}>
                                            <Plus aria-hidden="true" /> Tambah pegawai
                                        </Link>
                                    </Button>
                                </>
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
