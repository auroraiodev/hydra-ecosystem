---
name: new-api
description: Add a new API resource object to lib/api.ts in hydra-admin-dashboard. Use when a new management page needs backend integration — appends a typed API object using the apiCall wrapper pattern.
disable-model-invocation: true
---

Add a new API resource: $ARGUMENTS

## Context

- Current lib/api.ts (end of file): !`tail -60 lib/api.ts`
- Existing API exports: !`grep "export const" lib/api.ts`

## Steps

1. **Read `lib/api.ts`** to understand the `apiCall` wrapper signature and existing patterns.

2. **Append the new resource** at the end of the file:

```ts
export const resourceAPI = {
  list: () => apiCall('/resource'),

  get: (id: string) => apiCall(`/resource/${id}`),

  create: (data: Record<string, unknown>) =>
    apiCall('/resource', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiCall(`/resource/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiCall(`/resource/${id}`, { method: 'DELETE' }),
};
```

3. **Naming** — `<camelCase>API` (e.g., `tagsAPI`, `walletAPI`, `announcementsAPI`).

4. **Only include methods that exist on the backend** — Don't add stubs for non-existent endpoints.

5. **Update CLAUDE.md** — Add the new export to the "Available APIs" list.

6. **Report** — Export name added and endpoint path used.
