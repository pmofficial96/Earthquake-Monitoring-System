# UIUX.md — Design & Layout
## Project: Seismic Watch

### 1. Design Philosophy
- **Dark theme by default** — earthquake/seismic data dashboards look more serious and "scientific" on dark backgrounds (like NASA/USGS-style tools), and glowing map markers pop better.
- **Data-first, minimal chrome** — no unnecessary decoration; every element should communicate information.
- **Calm, not alarmist** — avoid red-flashing-siren aesthetics. Use a measured color scale (yellow → orange → red for magnitude) rather than constant red alerts, to keep it feeling analytical, not panic-inducing.

### 2. Color Palette
| Use | Color |
|---|---|
| Background | `#0B0F19` (near-black navy) |
| Panel/card background | `#141925` |
| Text primary | `#E8EAED` |
| Text secondary | `#9AA3B2` |
| Accent (low magnitude) | `#4ADE80` (green) |
| Accent (medium magnitude) | `#FACC15` (yellow) |
| Accent (high magnitude) | `#F87171` (red) |
| Borders/dividers | `#232A3B` |

### 3. Typography
- Headings: `Inter` or `Space Grotesk` (free Google Fonts, feels technical/modern)
- Body: `Inter`
- Monospace (for coordinates/data values): `JetBrains Mono` or `Roboto Mono`

### 4. Screen Layout

#### Main Dashboard (Home)
```
┌─────────────────────────────────────────────────┐
│  Seismic Watch        [Live: ●ON]   [Sync Now]   │ ← Header bar
├───────────────┬───────────────────────────────────┤
│               │                                   │
│  Filter Panel │        Map / Globe View           │
│  - Date range │   (toggle between 2D map / 3D)    │
│  - Min mag    │                                   │
│  - Region     │                                   │
│               │                                   │
├───────────────┴───────────────────────────────────┤
│  Magnitude over time chart  │  Frequency histogram │
└─────────────────────────────────────────────────┘
```

#### Risk Analysis Screen
```
┌─────────────────────────────────────────────────┐
│  ← Back            Aftershock Risk Analysis       │
├─────────────────────────────────────────────────┤
│  Select a recent major quake: [dropdown]          │
│                                                     │
│  ┌─────────────────────┐                          │
│  │  Aftershock Risk: 68% │  ← big visual gauge      │
│  └─────────────────────┘                          │
│                                                     │
│  Based on: magnitude 6.2, depth 12km,             │
│  historical aftershock rate in this region: 71%   │
└─────────────────────────────────────────────────┘
```

#### Seismic Gap Map Screen
```
┌─────────────────────────────────────────────────┐
│  Seismic Gap Analysis                              │
├─────────────────────────────────────────────────┤
│   [World map with regions shaded by gap_score]     │
│   Darker red = more "overdue"                     │
│                                                     │
│   Top 5 overdue regions (table):                   │
│   1. Region X — gap score 1.8                     │
│   2. Region Y — gap score 1.5                      │
└─────────────────────────────────────────────────┘
```

### 5. Component Behavior Notes
- **Map markers**: circle radius scales with magnitude (e.g., `radius = magnitude * 3`), color scales with depth (shallow = bright/red-ish, deep = darker/purple)
- **Live indicator**: pulsing green dot when auto-refresh is active, gray when paused
- **Loading states**: skeleton loaders for charts/map while data fetches — never show a blank white flash
- **Empty/error states**: if USGS API fails, show "Showing cached data from [timestamp]" rather than a broken UI
- **Mobile**: not a primary target (this is a presentation-laptop project), but keep layout reasonably responsive using Tailwind's flex/grid utilities so it doesn't break if projected at odd resolutions

### 6. Interaction Flow (for demo)
1. Land on dashboard → see live map populate
2. Click a quake marker → popup with details (magnitude, depth, time, place)
3. Click "Analyze Risk" on that popup → jumps to Aftershock Risk screen pre-filled with that quake
4. Navigate to Seismic Gap screen via nav bar → show overdue regions
5. (Optional) toggle to 3D globe view for the "wow" moment at the end of demo

### 7. Accessibility Notes (mention in presentation — shows maturity)
- Color scale also reflected in size/labels (not color alone) so it's not purely color-dependent
- Sufficient contrast ratio between text and background (dark theme tested against WCAG AA where feasible)
