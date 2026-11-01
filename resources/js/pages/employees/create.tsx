import { Head, useForm, Link } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { store, index as empIndex } from '@/routes/employees';
import { Plus } from 'lucide-react';

type Supervisor = { id: number; name: string };

export default function EmployeesCreate({
    supervisors,
}: {
    supervisors: Supervisor[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        avatar: null as File | null,
        role: 'employee',
        department: '',
        position: '',
        supervisor_id: '',
        kasbon_limit: '0',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), { forceFormData: true, preserveScroll: true });
    };

    return (
        <>
            <Head title="Tambah Pegawai" />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Tambah pegawai"
                    description="Lengkapi data pegawai baru."
                />

                <form
                    onSubmit={submit}
                    className="grid gap-5 rounded-xl border bg-card p-4 md:p-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="avatar">Foto profil</Label>
                        <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData(
                                    'avatar',
                                    e.target.files?.[0] ?? null,
                                )
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
                        <Label htmlFor="password">Password</Label>
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
                                setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
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
                            <Plus aria-hidden="true" /> Simpan
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={empIndex.url()}>Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
