---
name: hydra-icons
description: Standardizes icon usage for Hydra Collectables across Antigravity and Claude
---

# Hydra Icon Standard

To maintain the premium "Arcane Vault" aesthetic and visual consistency, all Hydra Collectables applications must strictly follow these icon standards.

## Primary Icon Library: Lucide React

All icons MUST be imported from `lucide-react`. Do not use `react-icons`, `heroicons`, or other icon libraries.

### Why Lucide?

- **Consistent Stroke Weights**: Matches the thin, elegant lines of the "Crystal Vault" (Light) and "Arcane Vault" (Dark) themes.
- **Customizability**: Easy to style with Tailwind CSS and Framer Motion.
- **Performance**: Tree-shakeable and lightweight.

## Common Mappings

If you see these `react-icons` (or others), migrate them immediately:

| Context         | Legacy Icon (React Icons)  | Standard Icon (Lucide)        |
| :-------------- | :------------------------- | :---------------------------- |
| Trash / Delete  | `IoTrashOutline`           | `Trash2`                      |
| Add / Plus      | `IoAddOutline`             | `Plus`                        |
| Remove / Minus  | `IoRemoveOutline`          | `Minus`                       |
| Cart            | `IoCartOutline`            | `ShoppingCart`                |
| Heart (Outline) | `IoHeartOutline`           | `Heart`                       |
| Heart (Filled)  | `IoHeart`                  | `Heart` (with `fill-current`) |
| Search          | `IoSearchOutline`          | `Search`                      |
| Help            | `IoHelpCircleOutline`      | `HelpCircle`                  |
| Shield          | `IoShieldCheckmarkOutline` | `ShieldCheck`                 |

## Best Practices

1. **Size**: Use `w-5 h-5` for standard navigation icons and `w-4 h-4` for inline micro-icons.
2. **Stroke Width**: Standard Lucide stroke width is 2px. For a more premium look, consider `strokeWidth={1.5}` or `strokeWidth={2.5}` depending on the hierarchy.
3. **Colors**: Always use semantic Tailwind classes (e.g., `text-primary`, `text-text-muted`).
4. **Consistency**: Before adding a new icon, check `WebNavbar.tsx` to see if a similar icon is already being used for that metaphor.

## Skill Integration

Antigravity and Claude MUST check this skill before implementing any new UI features or performing refactors. If an inconsistent icon library is detected, it should be flagged and migrated as part of the task.
