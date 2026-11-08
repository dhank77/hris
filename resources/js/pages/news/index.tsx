import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { index as newsIndex, create as newsCreate, edit as newsEdit, destroy as newsDestroy } from '@/routes/news';

type NewsItem = {
    id: number;
    title: string;
    body: string;
    published_at: string | null;
};

export default function NewsIndex({ news }: { news: { data: NewsItem[] } }) {
    return (
        <>
            <Head title="Berita Kepegawaian" />
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Berita Kepegawaian"
                    description="Kelola berita dan pengumuman untuk karyawan."
                    actions={
                        <Button asChild size="sm">
                            <Link href={newsCreate.url()}>
                                <Plus aria-hidden="true" /> Tambah berita
                            </Link>
                        </Button>
                    }
                />

                {news.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Belum ada berita.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {news.data.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-xl border bg-card p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                                            {item.body}
                                        </p>
                                        {item.published_at && (
                                            <time className="mt-3 block text-xs text-muted-foreground">
                                                {new Date(
                                                    item.published_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </time>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={newsEdit.url({ news: item.id })}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                if (confirm('Hapus berita ini?')) {
                                                    router.delete(
                                                        newsDestroy.url({ news: item.id }),
                                                    );
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
