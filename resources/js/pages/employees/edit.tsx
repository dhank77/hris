import { Head, useForm, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { update, index as empIndex, show as empShow } from '@/routes/employees';
import { Pencil } from 'lucide-react';

type Supervisor = { id: number; name: string };
type Employee = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role: string;
    department?: string | null;
    position?: string | null;
    supervisor_id?: number | null;
    kasbon_limit: number;
};

export default function EmployeesEdit({
    employee,
    supervisors,
}: {
    employee: Employee;
    supervisors: Supervisor[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: employee.name,
        email: employee.email,
        password: '',
        password_confirmation: '',
        avatar: null as File | null,
        role: employee.role,
        department: employee.department ?? '',
        position: employee.position ?? '',
        supervisor_id: employee.supervisor_id
            ? String(employee.supervisor_id)
            : '',
        kasbon_limit: String(employee.kasbon_limit ?? 0),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update.url({ employee: employee.id }), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Ubah Pegawai - ${employee.name}`} />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Ubah pegawai"
                    description="Perbarui data pegawai."
                />

                <form
                    onSubmit={submit}
                    className="grid gap-5 rounded-xl border bg-card p-4 md:p-6"
                >
                    <div className="grid gap-2">
                        <Label>Foto saat ini</Label>
                        {employee.avatar ? (
                            <img
                                src={`/storage/${employee.avatar}`}
                                alt={employee.name}
                                className="h-16 w-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                {employee.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="avatar">Ganti foto profil</Label>
                        <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData('avatar', e.target.files?.[0] ?? null)
                            }
                        />
                        <InputError message={errors.avatar} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            Password (kosongkan jika tidak diubah)
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Konfirmasi password
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Peran</Label>
                        <select
                            id="role"
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                        >
                            <option value="employee">Karyawan</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="hr">HR</option>
                            <option value="finance">Finance</option>
                            <option value="admin">Admin</option>
                        </select>
                        <InputError message={errors.role} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="department">Departemen</Label>
                        <Input
                            id="department"
                            value={data.department}
                            onChange={(e) =>
                                setData('department', e.target.value)
                            }
                        />
                        <InputError message={errors.department} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="position">Jabatan</Label>
                        <Input
                            id="position"
                            value={data.position}
                            onChange={(e) =>
                                setData('position', e.target.value)
                            }
                        />
                        <InputError message={errors.position} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="supervisor_id">Atasan</Label>
                        <select
                            id="supervisor_id"
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={data.supervisor_id}
                            onChange={(e) =>
                                setData('supervisor_id', e.target.value)
                            }
                        >
                            <option value="">— Tidak ada —</option>
                            {supervisors.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.supervisor_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="kasbon_limit">Limit kasbon</Label>
                        <Input
                            id="kasbon_limit"
                            type="number"
                            min={0}
                            value={data.kasbon_limit}
                            onChange={(e) =>
                                setData('kasbon_limit', e.target.value)
                            }
                        />
                        <InputError message={errors.kasbon_limit} />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            <Pencil aria-hidden="true" /> Simpan
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={empShow.url({ employee: employee.id })}>
                                Batal
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
