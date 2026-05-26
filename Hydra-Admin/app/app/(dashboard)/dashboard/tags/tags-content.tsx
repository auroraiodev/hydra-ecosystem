'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Add24Regular, Search24Regular } from '@fluentui/react-icons';
import { PageHeader } from '@/components/ui/page-header';
import { PageLayout } from '@/components/ui/page-layout';

import { TagsSkeleton } from './components/TagsSkeleton';
import { TagDialog } from './components/TagDialog';
import { TagsTable } from './components/TagsTable';
import { TagsMobileList } from './components/TagsMobileList';

import { useTagsManager } from './hooks/useTagsManager';

export default function TagsContent() {
  const {
    state,
    dispatch,
    handleSubmit,
    handleDelete,
    filteredTags,
  } = useTagsManager();

  const { isLoading, error, searchTerm, isSubmitting, dialog } = state;

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader title="Tags Management" description="Manage product tags" />
        <TagsSkeleton />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Tags Management"
        description="Manage product tags for categorizing singles"
        action={
          <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
            <Add24Regular className="size-4 mr-2" /> Add Tag
          </Button>
        }
      />

      {error && <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="mb-4 relative">
        <Search24Regular className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            {filteredTags.length} tag{filteredTags.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No tags found matching search.' : 'No tags found.'}
            </div>
          ) : (
            <>
              <TagsMobileList
                tags={filteredTags}
                onEdit={(tag) => dispatch({ type: 'OPEN_EDIT', tag })}
                onDelete={handleDelete}
              />
              <TagsTable
                tags={filteredTags}
                onEdit={(tag) => dispatch({ type: 'OPEN_EDIT', tag })}
                onDelete={handleDelete}
              />
            </>
          )}
        </CardContent>
      </Card>

      <TagDialog
        isOpen={dialog.isOpen}
        onClose={() => dispatch({ type: 'CLOSE_DIALOG' })}
        editingTagId={dialog.editingTag?.id || null}
        formData={dialog.formData}
        onFormChange={(data) => dispatch({ type: 'SET_DIALOG_FORM', data })}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  );
}
