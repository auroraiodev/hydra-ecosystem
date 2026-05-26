import { redirect } from 'next/navigation';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value);
  }
  // Strip local/pagination flags — keyword searches always use hybrid on /singles/search
  qs.delete('local');
  qs.delete('pagination');
  redirect(`/singles/search?${qs.toString()}`);
}
