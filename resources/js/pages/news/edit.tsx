import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { update as newsUpdate, index as newsIndex } from '@/routes/news';

type NewsItem = {
    id: number;
    title: string;
    body: string;
    published_at: string | null;
};

export default function NewsEdit({ news }: { news: NewsItem }) {
    const { data, setData, put, processing, errors } = useForm({
        title: news.title,
        body: news.body,
        published_at: news.published_at ? news.published_at.slice(0, 16) : '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(newsUpdate.url({ news: news.id }));
    };

    return (
        <>
            <Head title="Edit Berita" />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader title="Edit Berita" description="Ubah berita kepegawaian." />
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
