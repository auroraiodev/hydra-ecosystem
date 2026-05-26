import { redirect } from 'next/navigation';

export default async function CategoryRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ tcg: string; category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ tcg, category }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  // If the user navigates to /tcg/category, redirect them to /tcg/category/search
  // preserving search query parameters
  const searchParamsString = new URLSearchParams(
    Object.entries(resolvedSearchParams).map(([k, v]) => [k, String(v)])
  ).toString();

  const querySuffix = searchParamsString ? `?${searchParamsString}` : '?local=true&pagination=true';
  redirect(`/${tcg}/${category}/search${querySuffix}`);
}
