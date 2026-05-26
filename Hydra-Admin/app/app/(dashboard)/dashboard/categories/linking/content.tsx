'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';
import { categoriesAPI, tcgsAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  SpinnerIos20Regular,
  ArrowLeft24Regular,
  ArrowCounterclockwise24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import Link from 'next/link';

interface Tcg {
  id: string;
  name: string;
  display_name: string;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  tcgs?: Tcg[];
}

export default function CategoriesLinkingContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tcgs, setTcgs] = useState<Tcg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // catId:tcgId

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catsRes, tcgsRes] = await Promise.all([categoriesAPI.getAll(), tcgsAPI.list()]);

      const catsData = Array.isArray(catsRes)
        ? catsRes
        : (catsRes as { data?: { data?: Category[] } })?.data?.data ||
          (catsRes as { data?: Category[] })?.data ||
          [];

      const tcgsData = Array.isArray(tcgsRes) ? tcgsRes : (tcgsRes as { data?: Tcg[] })?.data || [];

      setCategories(catsData);
      setTcgs(tcgsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleToggleLink = async (category: Category, tcg: Tcg, currentLinked: boolean) => {
    const operationKey = `${category.id}:${tcg.id}`;
    setIsUpdating(operationKey);

    try {
      const currentTcgIds = category.tcgs?.map((t) => t.id) || [];
      let newTcgIds: string[];

      if (currentLinked) {
        newTcgIds = currentTcgIds.filter((id) => id !== tcg.id);
      } else {
        newTcgIds = [...currentTcgIds, tcg.id];
      }

      await categoriesAPI.update(category.id, {
        tcg_ids: newTcgIds,
      });

      // Update local state
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === category.id) {
            const updatedTcgs = currentLinked
              ? c.tcgs?.filter((t) => t.id !== tcg.id) || []
              : [...(c.tcgs || []), tcg];
            return { ...c, tcgs: updatedTcgs };
          }
          return c;
        })
      );

      toast.success(
        `${category.display_name} ${currentLinked ? 'desvinculada de' : 'vinculada a'} ${tcg.display_name}`
      );
    } catch (error) {
      console.error('Error updating link:', error);
      toast.error('Error al actualizar vinculación');
    } finally {
      setIsUpdating(null);
    }
  };

  const isLinked = (category: Category, tcgId: string) => {
    return category.tcgs?.some((t) => t.id === tcgId) || false;
  };

  return (
    <PageLayout>
      <PageHeader
        title="Matriz de Vinculación"
        description="Gestiona qué categorías aparecen en cada TCG de forma masiva."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/categories">
                <ArrowLeft24Regular className="mr-2 size-4" />
                Volver a Categorías
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void fetchData()}>
              <ArrowCounterclockwise24Regular
                className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6', 'sk7', 'sk8'].map((id) => (
                <Skeleton key={id} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-4 text-left font-bold border-r sticky left-0 bg-muted/50 z-10 w-[250px]">
                      Categoría / Supracategoría
                    </th>
                    {tcgs.map((tcg) => (
                      <th key={tcg.id} className="p-4 text-center font-bold min-w-[120px] border-r">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm">{tcg.display_name}</span>
                          <code className="text-[10px] bg-background px-1 rounded opacity-60">
                            {tcg.name}
                          </code>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium border-r sticky left-0 bg-white dark:bg-zinc-950 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col">
                          <span>{category.display_name}</span>
                          <code className="text-[10px] text-muted-foreground">{category.name}</code>
                        </div>
                      </td>
                      {tcgs.map((tcg) => {
                        const linked = isLinked(category, tcg.id);
                        const updating = isUpdating === `${category.id}:${tcg.id}`;

                        return (
                          <td key={tcg.id} className="p-0 text-center border-r group">
                            <button
                              onClick={() => handleToggleLink(category, tcg, linked)}
                              disabled={!!isUpdating}
                              className={`size-full p-4 flex items-center justify-center transition-all ${
                                linked
                                  ? 'bg-blue-50/30 dark:bg-blue-950/10 text-blue-600'
                                  : 'text-zinc-300 hover:text-zinc-400'
                              } ${updating ? 'cursor-wait' : 'cursor-pointer'}`}
                            >
                              {updating ? (
                                <SpinnerIos20Regular className="size-5 animate-spin text-blue-600" />
                              ) : linked ? (
                                <div className="bg-blue-600 text-white rounded-md p-1 shadow-sm group-hover:scale-110 transition-transform">
                                  <Checkmark24Regular className="size-4 stroke-[3px]" />
                                </div>
                              ) : (
                                <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-md p-1 group-hover:border-zinc-300 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900 transition-all">
                                  <Dismiss24Regular className="size-4 opacity-20" />
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-muted-foreground">
        <p className="font-bold text-foreground">💡 ¿Cómo usar esta tabla?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Haz clic en cualquier celda para activar o desactivar la categoría para ese TCG
            específico.
          </li>
          <li>
            Los cambios se guardan automáticamente y se aplican al instante en el formulario de
            &quot;Agregar Producto&quot;.
          </li>
          <li>
            Las filas representan las **Categorías** (lo que vendes) y las columnas representan las
            **Supracategorías** (el juego al que pertenecen).
          </li>
        </ul>
      </div>
    </PageLayout>
  );
}
