# ui.localhost

Studio-style reusable UI kit.

## Why this exists

- keeps the same import ergonomics as shadcn-style kits (`@/ui.localhost`)
- reuses your current `components/ui/*` controls and accessibility behavior
- reuses studio visuals from `components/studio/*` and global motion classes

## Structure

- `index.ts`: barrel exports for controls + studio kit parts
- `tokens.ts`: layout, typography, surface, and motion tokens
- `components/section-title.tsx`: mono heading block
- `components/folder-tile.tsx`: folder icon + randomized label tile
- `components/command-panel.tsx`: command palette visual block

## Usage

```tsx
import {
  Button,
  Input,
  UiLocalhostSectionTitle,
  UiLocalhostFolderTile,
  UiLocalhostCommandPanel,
  uiLocalhostTokens,
} from "@/ui.localhost"
```
