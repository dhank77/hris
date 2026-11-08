import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { store as newsStore, index as newsIndex } from '@/routes/news';

export default function NewsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        body: '',
        published_at: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(newsStore.url());
    };

    return (
        <>
            <Head title="Tambah Berita" />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader title="Tambah Berita" description="Buat berita kepegawaian baru." />
                <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-card p-5">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Judul</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">Isi</Label>
                        <textarea
                            id="body"
                            rows={6}
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                        />
                        {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="published_at">Tanggal publikasi (opsional)</Label>
                        <Input
                            id="published_at"
                            type="datetime-local"
                            value={data.published_at}
                            onChange={(e) => setData('published_at', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={newsIndex.url()}>Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
