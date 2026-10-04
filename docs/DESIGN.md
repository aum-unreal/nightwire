# Nightwire UI overhaul: build spec ("Booklight")
Status: definitive. Work only in `~/dev/nightwire-ui` (branch `ui-overhaul`). Never touch `~/dev/nightwire`; another agent works there.

Direction: **Booklight** won on all 3 judges. It carries the endorsed grafts from Night Galley and Night Bench; rejected ideas are listed in §2. Where this doc and the README disagree, this doc wins. E0 rewrites the README at the end.
## 1. Concept
At 2 am a reader holds a page, a clip-on booklight and a bookmark. Nightwire is that kit. The room is OLED black, and every object is one of two materials: **Paper**, for what you read and file: sheets, index cards, slips, the ribbon · **Lamp hardware**, for what you adjust: anodised keys, rockers, slide switches, the dimmer wheel, the card slot, the pull chain

The user's accent is **the colour of the bulb**. It appears only as a lit pip, a progress filament, or one faint pool of light on the current object. It is never paint on a button.

Principles: (1) **One name per place: Desk, Shelf, Map, Read.** Search and Open are actions, not places. Each layout has one Open (the `.md` slot) and one global Search. Each view has at most one Settings entry. (2) **Accent is light.** Every neutral derives from the accent (§3.1), so the 8 presets or a custom hex reskin the whole app. A second hue appears only in Map layers and code syntax. (3) **Voices.** Words: Work Sans; Data: IBM Plex Mono; Titles: Fraunces; Prose: the reading face (default Literata); Inter and Roboto never appear in chrome. (4) **Tactility is travel and seating.** Pressed keys sink 2px. Selected keys stay seated 1px with their pip lit. Switches have real positions and haptic detents. Nothing glows, blurs, lifts or ripples. (5) **Whole objects.** Lists snap to whole rows, so no row is ever cut mid-glyph. Clamp text by lines. Filenames get a middle ellipsis. (6) **Quiet at 4 am.** One lit thing per region. On phone, chrome hides while you read. Each screen gets one signature object, and everything else is hairline typography: Desk: ribbon and fore-edge; Reader: progress rail and chain; Prefs: dimmer wheel; Map: grommet and paper tag; Read: the instrument.
## 2. Banned (never reintroduce)
**Chrome** — Top bars, breadcrumbs, "WORKSPACE", and anything else that echoes the route · A second Open, Search or Settings control in the same layout · Count badges. Decorative numbering such as 01–05 keys or `01 / SANS` · Keyboard hints outside `@media (hover:hover) and (pointer:fine)`. `⌘` on non-Mac. `ESC` chips · Taglines and fake status: LOCAL / OFFLINE, ON DEVICE, NO VAULT REQUIRED, NW / v0.9, MARKDOWN READER, PORTABLE / LOCAL, OFFLINE / ON DEVICE, `NIGHTWIRE / X` labels, FUZZY + PREFIX MATCHING, inert status dots, PAN / PINCH · Fake instruments that measure nothing: static rulers, grilles, LED squares, the ⌁ bolt · Snackbars over content, `pointer-events:none` notices, ghost toasts

**Type and icons** — Letter-spaced uppercase eyebrows. At most one caps label per screen, at ≥11px with ≤.06em tracking · Text under 11px · Eyebrow + tagline title pairs. Titles ending in "." ("Files.", "Trace.", "Tools for this read.") · Stock Lucide icons on routes, tools or rows · `↗` on in-app links. Keep it for external URLs only

**Colour and surface** — Accent-filled, gradient, glowing or pill buttons. The only accent fills allowed are the lit gel lens, the ribbon and the find marker band · Hardcoded hues in chrome: #75dfeb, #e994d3, #c8fa72, #040606, #162019, #090d0b, #263120, #718078. No `--cyan` or `--pink` in shell or surface CSS · Gradient cards with a left accent bar. Radius over 6px on rectangles · Drop shadows, glows larger than a pip, `backdrop-filter`, `.press-wave` ripples, hover lift · Native `<select>` in chrome. iOS pill toggles · Grain on anything that scrolls behind text. Light pools over 8% alpha, or more than one pool per screen · Magic sticky offsets (74/65/139/180px). Use `--strip-h` instead

**Judge-rejected** — Typed-on text and flicker or "spark" frames · Ribbon swing. Chain stretch or drag · Dymo tapes and any rotated text · Rubber stamps, hand-drawn ellipses, wavy strikes, paperclips, magnet tiles · KWIC search. Vertical writing-mode nav · The lamp-falloff overlay. The "1 section ≈ n px" scale · Odometers anywhere except the dock % readout · Punch rows in tray cards
## 3. Tokens (`assets/ui/tokens.css`, E0)
### 3.1 Colour
JS writes the final hex values; the CSS below is the untinted fallback. `color-mix()` and `oklch()` are progressive enhancement only.

```css
:root{--room:#000;--bg:#000;
 --ink-1:#070707;--ink-2:#0e0e0d;--ink-3:#171716;   /* tray/dock/sheets · paper · raised paper, flap, tabs, pressed */
 --rule:#262523;--rule-2:#3a3936;--paper-edge:#3a3936;
 --text:#e7e4de;--muted:#aaa69e;--subtle:#8a867f;   /* 16:1 · 8.7:1 · 5.8:1 on #000; --subtle = floor for 11–12px Plex */
 --accent:#c8fa72;--accent-rgb:200,250,114;--accent-ink:#101410;   /* existing names; tests pin --accent = preset hex */
 --lamp:var(--accent);--lamp-hi:#e1fcb1;--lamp-dim:#5a7033;--lamp-wash:#c8fa7214;--lamp-ink:var(--accent-ink);
 --hue-2:#75dfeb;--hue-3:#e994d3;   /* palette secondary/tertiary: Map layers + code/source syntax ONLY */
 --danger:#ff8a7a;--warn:#e8c547;
 --surface:var(--ink-2);--raised:var(--ink-3);--line:var(--rule);   /* legacy aliases (instruments) */
 --pool:radial-gradient(130% 70% at 50% -20%,var(--lamp-wash),transparent 62%);
 --grain:url("data:image/svg+xml,…");   /* one static 160px feTurbulence tile: baseFrequency .9, numOctaves 2, alpha .04 */}
```

`applySettings()` keeps writing everything it writes today: `--accent` with its `-rgb`, `-soft`, `-border` and `-ink` siblings, `--cyan`, `--pink`, `--font-size` and `--reader-leading`. It also writes the tokens below. Here `A` is the accent, `k` is the intensity factor (quiet .6, balanced 1, vivid 1.5), and `mix` is the existing helper.

| Token | Value |
|---|---|
| `--ink-1` | `mix('#070707',A,.03k)` |
| `--ink-2` | `mix('#0e0e0d',A,.05k)` |
| `--ink-3` | `mix('#171716',A,.08k)` |
| `--rule` | `mix('#262523',A,.10k)` |
| `--rule-2` | `mix('#3a3936',A,.14k)` |
| `--paper-edge` | `mix('#3a3936',A,.22)` |
| `--text` | `mix('#e7e4de',A,.04)` |
| `--lamp-hi` | `mix(A,'#fff',.45)` |
| `--lamp-dim` | `mix('#000',A,.45)` |
| `--lamp-wash` | `A+'14'` |
| `--hue-2` | `p.secondary` |
| `--hue-3` | `p.tertiary` |
| `--surface`, `--raised`, `--line` | `--ink-2`, `--ink-3`, `--rule` (replaces the old formulas) |

`body.high-contrast` sets `--ui:"NW Atkinson Next",system-ui,sans-serif`, `--muted:var(--text)`, `--subtle:#b9b5ad` and `--rule:var(--rule-2)`.

**Accent budget (per screen).** Only these may be lit: the seated route pip · progress: the desk fore-edge, reader rail, dock %, shelf punch row and tray filament · the current-section marker · the focus ring · one pool, on the single current object · find hits · the ribbon · the Map grommet and the selected neighbourhood

**Accent rules** — Accent-coloured text only at ≥12px. `readableAccent()` keeps the accent at ≥6.6:1 on black · Text on an accent fill uses `--accent-ink` · Links use the text colour with a 1px `--lamp` underline, offset 3px · `--danger` only on the remove hold key and danger callouts · `--warn` only in the warning hatch
### 3.2 Type
All faces are bundled in `fonts.css`.

| Token | Value | Use |
|---|---|---|
| `--ui` | `"NW Work Sans",system-ui,sans-serif` | words |
| `--display` | `"NW Fraunces",Georgia,serif` | titles, ≥20px only |
| `--data` | `"NW Plex Mono",ui-monospace,monospace` (also `--mono:var(--data)`) | numbers, filenames, stamps, line numbers, canvas labels |
| `--code` | `"NW JetBrains Mono",ui-monospace,monospace` + `font-variant-ligatures:none` | code and source view; fonts.cjs forbids Plex in source |
| `--sans` | `system-ui,Roboto,"Segoe UI",sans-serif` | the "System sans" reading option only; Inter removed |
| `--reading-font` | set by JS | prose |

| Token | Spec | Use |
|---|---|---|
| `--fs-cap` | 11.5/600 ui | dock and rail captions only |
| `--fs-data` | 12 data | stamps, counts, filenames; 11 is allowed for line numbers and tray meta |
| `--fs-sm` | 13 ui | secondary text; `.group-label` is 12/600 |
| `--fs-ui` | 14/450 ui | default; keys use 550 |
| `--fs-row` | 15/500 | rows and inputs |
| `--fs-sheet` | 22 display, wght 520 | sheet titles |
| `--fs-page` | 30 display, wght 480 | the Shelf h1 |
| `--fs-mast` | 40 display italic, wght 560 | the phone Desk masthead |

Fraunces variation settings: `--fv-mark:"opsz" 72,"SOFT" 100,"WONK" 1` (wordmark only) · `--fv-title:"opsz" 144,"SOFT" 50,"WONK" 0` · `--fv-sheet:"opsz" 36,"SOFT" 30,"WONK" 0`

Rules: Tracking 0; display −0.01em. UI line-height 1.35 · Sentence case. Tabular numerals · Copy patterns: "41 min · 19%", "§2" for sections, "→" for in-app forward links

**Wordmark:** "Nightwire" in Fraunces italic `--fv-mark`. The first i is a dotless `ı` (U+0131) whose dot is a 6px lit `.pip`.
### 3.3 Space, shape, light, layout
**Space and shape** — `--sp-1…12`: 4/8/12/16/20/24/32/40/48px · `--gutter`: 16px in dock mode, 24px in tray mode. `--hit`: 44px · `--r-paper:2px`, `--r-key:4px`. Circles only for pips, gels and the wheel · Hairline `1px solid var(--rule)`; the strong rule uses `--rule-2`

**Depth** (paper never gets a drop shadow) — `--key-rest: inset 0 1px 0 #ffffff14, inset 0 -2px 0 #000, 0 2px 0 #1a1a18` · `--key-down: inset 0 1px 2px #000, inset 0 -1px 0 #ffffff10` · `--key-seat: inset 0 1px 2px #000, inset 0 -1px 0 #ffffff0d, 0 1px 0 #1a1a18` · `--paper-lit: inset 0 1px 0 var(--paper-edge), inset 0 -1px 0 #000` · Pip glow at most `0 0 6px rgb(var(--accent-rgb)/.35)` · Backdrop `rgb(0 0 0/.72)`, or .35 behind side sheets. Never blur

**Layout** — `--tray-w`: 212px at 801–1189px, 248px at ≥1190px. `--rail-w`: 76px. `--card-h`: 56px · `--strip-h` is measured by JS (fallback 48px). `--mobile-nav-height` keeps its name · z-order: strip 20, dock and tray 30, receipt 40, chain 45 · Containers are named `desk`, `shelf` and `reader`. Never set `container-type` on `#content` or on any ancestor of a fixed element
### 3.4 Motion
- Durations: `--t-press:70ms`, `--t-fast:120ms`, `--t-move:180ms`, `--t-sheet:220ms`. Easing: `--ease:cubic-bezier(.2,.8,.2,1)`. `--press-speed` becomes an alias of `--t-press`.
- Animate transform and opacity only.

Reduced motion applies under `@media (prefers-reduced-motion:reduce)` or `body.no-motion`: `--t-*` drop to 0ms · The strip and dock never auto-hide · Sheets appear without sliding · The odometer swaps digits instead of rolling · The desk stagger is off (via the existing `motion()`) · Haptics still follow the Touch feedback setting
## 4. Primitives (E0 builds these first, in `assets/ui/primitives.css`)
### Key
`button.key`. Variants: `.key--plate` (default), `.key--text`, `.key--icon`, `.key--row`, `.key--paper`. — **Anatomy:** `[span.pip][svg.glyph] span.key-label [span.key-meta]`. Minimum 44×44. Face `var(--key-face,#0b0b0a)` with `--key-rest`. Label 14/550 in `--muted` · **Pressed** (`:active` or `.is-pressed`): `translateY(2px)` + `--key-down` · **Seated** (`[aria-pressed=true]`, `[aria-current=page]`, `[aria-selected=true]` or `.is-on`): `translateY(1px)` + `--key-seat`, label `--text`, pip lit · **Hover:** fine pointers only; the label goes to `--text` · **Disabled:** opacity .45, no travel · **Variants:** `--text`: no plate; `--text` with a 1px `--rule-2` underline at offset 4 that turns `--lamp` when pressed; `--icon`: glyph only; needs an aria-label; `--row`: full width, 48px, label left, Plex `.key-meta` right; `--paper`: a paper face with a lit top edge
### Pip
`span.pip`, 8px. — **Off:** `#1c1c1a` with an inset dark ring · **Lit** (`.is-lit`, or inside a seated ancestor): `radial-gradient(circle at 40% 35%,var(--lamp-hi),var(--lamp) 55%,var(--lamp-dim))` + glow
### Rocker
`button.rocker[role=switch][aria-checked][aria-label]`, holding `span.rocker-off` "off", `span.rocker-on` "on" and `.pip`. — A 56×32 plate in a 60×44 hit area. The selected half sits lower and darker. Plex 11 · State comes only from `aria-checked`; the existing handlers already set it · Setting row: `div.setting` > `.setting-text` (`.setting-name` 15/500, `.setting-note` 13 `--muted`) + the rocker
### Slide switch
`div.slide[role=group][aria-label]` > n × `button.slide-pos[aria-pressed]` + `span.slide-thumb[aria-hidden]`. — **Track:** recessed `#050505`, `inset 0 2px 3px #000`, 44px tall · **Thumb:** knurled, positioned by `--i`/`--n` from `syncSlides()`; `left` transitions over `--t-move` · The selected label is `--text` with a lit pip · Positions are buttons, not radios, because tests read `aria-pressed`
### Ruler
`div.ruler-row` = [key −] `input[type=range].ruler` [key +] `output.ruler-readout` (Plex 12). — **Track:** 14px on `#050505`, with `--rule-2` ticks every 6px and major ticks every 30px · **Thumb:** a 6×28 needle knurled with `repeating-linear-gradient(90deg,#20201e 0 1px,#0c0c0b 1px 3px)`, with a 3px `--lamp` tip
### Field
`label.field` > `span.field-label` (12/600) + `input`. — 44px tall on `#050505`, with one `1px solid var(--rule-2)` baseline that turns `--lamp` on focus. Text 15px ui · `.field--search` adds the search glyph. Use it only for global search and the type case
### Row
`.row` (button or div): grid `[.row-num] .row-main(.row-title,.row-meta) [.leader] [.row-end]`. — 48px minimum height, with hairlines between rows · `aria-current` gives a lit pip and a seated row · `.leader` is a dotted filler. Use it only when it leads to a real datum
### Sheet
`dialog.sheet` (`#panel-dialog`, `#search-dialog`): `div.sheet-lip` + `header.sheet-head` > `h2.sheet-title#panel-title[tabindex=-1]` + `div.sheet-body#panel-content` + `footer.sheet-foot` > `button.key.sheet-close[data-close][aria-label="Close panel"]`. — **Phone:** `bottom` (≤92dvh) or `full` (100dvh). Close is a full-width "Close" at the bottom. Drags start only on the 44px lip; close at velocity >0.6px/ms or past 40% of the height · **Wide:** every panel is a full-height right side sheet on `--ink-1` with a lit left edge, `--sheet-w` 380, 400 or 560. Close sits top-right as × · Slides in over `--t-sheet` · `openPanel(title,html,{size,width})` focuses the title, never the close key · Delete `#panel-eyebrow` and the centred card
### Paper
`.paper` = `--ink-2` + `--paper-lit` + radius 2. — `.paper--lit` adds `--pool`. One per screen · `.paper--grain` adds `--grain`. Only on the desk sheet and the wide prefs sheet · `.paper--fold` is a real 22px fold: a clip-path corner cut plus an `::after` flap in `--ink-3`, with a 135° crease gradient and a 1px `--paper-edge` hypotenuse
### Small parts
- `.perf`: 8px, `radial-gradient(circle,var(--rule-2) 1.2px,transparent 1.5px) 0 50%/7px 8px repeat-x`.
- `.stamp`: Plex 12 `--subtle`, with `·` separators.
- `.group-label`: 12/600 ui `--muted`, sentence case.
- `.sr-only`.
### Tag mark
`button.tag-mark[data-action=tag-search][data-tag]`. — Plex 12.5 (0.86em in prose), `--muted`, with a 1px dotted underline at offset 3 · 44px tall hit area. No chip, no box, no pink
### Ribbon
`button.ribbon[data-action=star][data-id][aria-pressed]`, aria-label "Bookmark <name>" or "Remove bookmark from <name>". Hit area 44×56. — **Off:** a 10px `--rule-2` stub · **On:** a 14×56 swallowtail, `clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%)`, filled `mix('#000',A,.62)` with a 1px darker centre fold. It drops in with `scaleY` .18→1 from the top over `--t-move` · Tap only
### Slot
`button.slot[data-action=import]` > `span.slot-grip` (ruled) + `span.slot-card` (a paper edge stamped ".md" in Plex) + `span.slot-label`. — **Mouth:** `inset 0 3px 4px #000, inset 0 -1px 0 #ffffff12` · **Pressed:** the card drops 4px · **`body.is-feeding`** (a file is dragged over the window): the mouth opens 4px; the card gets the pool and a `--lamp` ".md" · **Sizes:** `--dock`: a 46×80 tab; `--tray`: a 52px row, "Open Markdown"; `--large`: ≥280×64, "Open a Markdown file"
### Type slug
`.type-trigger`. The markup from `reader-fonts.js` stays. — A 44px `--ink-3` block. "Aa" (`.type-trigger-glyph`) in the reading face at 17px; `.type-trigger-name` in Plex 12 · A nick notch replaces ⌄. `.type-trigger-notch` stays, empty · E7 restyles it inside `.terminal-main`
### Glyph sprite
An `<svg hidden>` at the top of `<body>` holds `<symbol id="g-*" viewBox="0 0 24 24">` entries. `glyph(n)` returns `<svg class="glyph" aria-hidden="true"><use href="#g-n"/></svg>`: 20px, stroke 1.75, `currentColor`, round caps, no fills.

E0 draws: desk: a sheet with a fold · shelf: three card edges in a tray · map: three pins on an elbowed wire · read: a word bar in a window frame · search: a lens over ruled lines · find: a lens over a page · contents: a page with thumb notches · tools: three stacked slips · prefs: a dimmer ring with knurl ticks and a pointer · chain: a bead line with a pull bead · copy: two offset slips · visor: a window with a half-drawn shutter and a grip · fit: four corner brackets · back, ribbon, close, up, down, plus, minus, chevron, tick

Surfaces add symbols only inside their own `<!-- glyphs:<surface> -->` block. Lucide stays loaded only for the Read instruments and `terminalFiles()`; no `icon()` calls anywhere else.
### Focus
`:focus-visible{outline:2px solid var(--lamp);outline-offset:3px}`, with square corners. `[tabindex="-1"]:focus{outline:none}`.
### Press and haptics
- Keep `.is-pressed` and `feedback(kind)`.
- Delete `pressWave`, `.press-wave` and the `.tactile` scale.
- Every control has a pressed state with at least 1px of travel.
- `'selection'` for keys, detents and slides; `'confirm'` for bookmark, palette, theme and remove. No new vibration patterns.
### Helpers (E0, app.js)
- `glyph()`.
- `syncSlides(root)`, called inside `icons()`.
- `[data-middle]` middle ellipsis. Plex is 0.6em per character, so `chars = ⌊width/(0.6·px)⌋`. Keep the extension plus the last 8 characters.
- `progressOf(id)` → 0..1 or null.
- `sectionAt(analysis,p)` → `{n,heading}`, via `heading.line/analysis.lines`.
- `sameName(title,file)`: lowercase both, strip the extension, turn `_` and `-` into spaces, trim.
- `focusSheetTitle()`.
- `core.js analyze()` gains `lede` (first paragraph text, ≤240 chars) and `lines` (source line count).
## 5. Files, owners, sequence
E0 lands first: tokens, base, primitives, sprite, helpers, the file split, the `openPanel` signature and the `actions` split. Then E1–E7 work in parallel, each only in their own files and their own app.js functions.

E0's split recipe: (1) Create the files in the table below. (2) Set the `<head>` order in `index.html`: `fonts.css`; `ui/`: tokens, base, primitives, shell, desk, shelf, prose, reader-page, search, dialogs, prefs, typecase; `graph-board.css`; `terminal.css`, `terminal-screen.css`, `read-themes/*.css`, `read-styles.css`; `ui/read-shell.css`, `terminal-blackout.css`, `terminal-anchor.css` (3) Preload `work.ttf`, `plex-mono.ttf`, `fraunces.ttf`, `fraunces-italic.ttf` and `literata.ttf`. (4) Move every rule from `style.css`, `desk.css`, `reader.css`, `nav-dock.css` and `font-rack.css` into the owning file under `/* LEGACY — delete as you rebuild */`. `.button`, `.icon-btn` and `.text-button` go to the primitives LEGACY block. (5) Delete those five files. (6) Never add an override layer. `grep -r LEGACY assets/ui` must be empty at merge.

| Owner | Files | app.js functions (edit only these) | Tests owned |
|---|---|---|---|
| **E0** Foundation | `ui/tokens`, `ui/base`, `ui/primitives`; `index.html` `<head>`, sprite and `#panel-dialog`; `core.js` | constants, palette, applySettings, feedback, icons, openPanel/closePanels, helpers, click/pointer/keydown handlers, `actions` structure, `Nightwire.debug` | `browser.cjs`, `shots.cjs`, new `tests/contrast.cjs` |
| **E1** Shell | `index.html` shell (tray, dock, `#toast`); `ui/shell.css` | nav, navigate, toast/receipt, receiveLibrary, drag/drop, `is-short`, setDockCollapsed, `Nightwire.back` | `nav-dock.cjs`, `navigation.cjs`, `blackout.cjs` |
| **E2** Desk & Shelf | `ui/desk.css`, `ui/shelf.css` | home, deskRow, animateDesk/stopDeskMotion, library, renderLibraryCards, shelfCard (ex fileCard), sortedDocs, star, loadSamples | `themes.cjs` |
| **E3** Reader | `ui/prose.css`, `ui/reader-page.css`, `reader-themes.js` | openDocument, outlineHtml, renderReader, renderMarkdown, jumpTo, find functions, updateProgress + scroll handler, more, references, removeCurrent, copy, exports | none (hands renames to test owners) |
| **E4** Search & dialogs | `ui/search.css`, `ui/dialogs.css`, `search-worker.js`, `index.html` `#search-dialog` | openSearch, querySearch, `searchWorker.onmessage`, pastePanel, licenses | none |
| **E5** Prefs & Type case | `ui/prefs.css`, `ui/typecase.css`, `reader-fonts.js` | preferences, readerControls, sync*Controls, typefaces, settings actions, migrateSettings | `fonts.cjs`, `font-rack.cjs`, `font-sync.cjs`, `alignment.cjs` |
| **E6** Map | `graph-board.js`, `graph-board.css` | renderGraph, ensureGraphAnalysis, drawGraph, paintGraphLabels, graphHit, selectGraphNode, openGraphSelection, graph actions | `graph-board.cjs` |
| **E7** Read | `read-styles.js/.css`, `read-themes/*`, `terminal-reader.js`, `terminal*.css`, `ui/read-shell.css` | renderTerminal, terminalFiles | `cyberdeck.cjs`, `terminal.cjs`, `index-themes.cjs`, `word-anchor.cjs`, `theme-preview.cjs` |

app.js rules: The file is dense one-liners. Never reformat it, and re-read it before every edit · E0 splits `const actions={…}` into one commented line per owner. Owners add their own `Object.assign(actions,{…})` line · E0 converts every `openPanel(…,'EYEBROW')` call to the options form · Cross-owner calls go only through named APIs: `toast(msg,{undo})` and `setDockCollapsed(on)` (E1), `openPanel` and the helpers (E0), and `stylePicker()` (E7, placed by E5) · E0's final pass: `browser.cjs`, README naming, the `shots.cjs` "after" set, and the AGENTS.md version bump
## 6. Surfaces
### 6.1 Shell (E1)
**Modes**
- **Dock mode** is `@media (max-width:800px)` or `html.is-short`; JS sets `is-short` when innerWidth >800 and innerHeight <561 (a landscape phone); It recomputes only when no input, textarea or contenteditable has focus. The WebView resizes for the IME, so this stops the keyboard from flipping the layout; Only `display`, `--mobile-nav-height` and the main padding are conditional; dock internals are unconditional.
- **Tray mode** is everything else. Desk, Shelf and Map get the full `--tray-w`. Reader and Read get the 76px rail, and `.main-column`'s margin follows it over `--t-move`.
- Delete `header.topbar` entirely: breadcrumb, status, search, sliders and Open file.

**Tray** — `aside.sidebar.tray[aria-label="Library"]`. Keep the `.sidebar` class; tests use it. It is a flex column with 12/8 padding, and every block is `flex:none` except the cards.
1. `.tray-mark` (48px): the 22px wordmark. aria-hidden, not a heading or link.
2. `button.key.key--row.tray-search[data-action=search][aria-label=Search]` (44px): glyph + "Search", plus a "Ctrl K" chip on fine pointers only ("⌘ K" on Mac). 6px gap after.
3. `nav.tray-routes[aria-label="Main navigation"]`: four 44px `button.key.key--row.nav-key[data-action=home|library|graph|terminal][aria-label=Desk|Shelf|Map|Read]`. Each has a glyph, a 14/550 label and a pip. Seating is the only active marker. 8px gap after.
4. `ol.tray-cards` (`flex:1 1 0`): `li > button.tray-card[data-action=document][data-id]`, each exactly `--card-h` tall; `.tray-card-title`: 13/550, one line; `.tray-card-meta`: Plex 11. The middle-ellipsis filename when `!sameName`, otherwise "41 min"; `.tray-card-filament`: 2px, progress in `--lamp` on a `--rule` track; The open document's card gets `aria-current="true"`, a seat and the pool; A ResizeObserver sets `max-height:⌊avail/56⌋×56px`, with `scroll-snap-type:y mandatory` and `snap-align:start`; On overflow, show a 20px lip (mask fade + 1px `--rule`). The last row becomes `key--text[data-action=library]` "+N more on the shelf"; Hide the list when fewer than 2 rows fit. Drop `slice(0,8)`.
5. `div.tray-receipt`: the receipt lane. It overlays the bottom of the cards, never `main`.
6. `button.slot.slot--tray[aria-label="Open Markdown files"]` (52px).
7. `button.key.key--row.prefs-key[data-action=settings][aria-label="Reading preferences"]` (44px): glyph + "Preferences".

**Rail** (76px) — The wordmark becomes a pip-dotted italic "N" · Search and route keys: glyph over a `--fs-cap` caption, 56px tall · Cards and receipt are hidden. The slot becomes a 56px `.md` tab. Prefs shows the glyph only · In Read, search and prefs are hidden because the instrument has both · Materials come from `ui/read-shell.css`. The pip is always `--lamp`

**Dock** — `nav.mobile-nav[aria-label="Main navigation"] > .nav-switchboard`. Keep its ids and classes. — `.nav-register` (24px readout div): `#dock-context`: the open or last document's title, 12.5/550; "No file open" when the library is empty; `#dock-section`: e.g. "§3 Pause", 12 `--muted`; hidden below 360px; `#dock-count`: % read in odometer digits, Plex 12, `aria-label="19% read"`. It rolls only after 250ms of scroll idle · `.nav-routes`: five 50px `button.nav-key`s with glyph over caption: Desk, Shelf, Map, Read, and `.nav-search` (Search, with `aria-controls`/`aria-expanded`); Below 360px, inactive keys show the glyph only; The active key is `flex:1.7` (tests need >1.6), with glyph and caption inline, seated, pip lit · `button.nav-load.slot.slot--dock[aria-label="Open Markdown files"]` spans both rows · `--mobile-nav-height:calc(86px + env(safe-area-inset-bottom))`. Background `#000` with a 1px `--rule` top border · In Read, `.nav-search` and `.nav-load` are hidden

**Spine** (`body.dock-collapsed`) — Routes and slot hide. The register grows to 44px and is covered by `button.dock-expand[aria-label="Show navigation"][aria-expanded=false]`. A tap expands it; swiping is never the only path · Height drops to 52px + safe area · Triggers: E3's reader scroll: collapse after scrolling down >24px; expand on any scroll up; E7's `onPlaying` · Never collapse while focus is inside the dock, under reduced motion, or on Desk, Shelf or Map

**Navigation** — `nav()` sets `aria-current=page` and `.active` only on the route key whose `data-action` equals `state.view`. The reader marks no route · `Nightwire.back()` from the reader calls `navigate(state.returnTo||'library')` · A file dragover sets `body.is-feeding` (renamed from `.dragging`) · In dock mode, `main` gets `padding-bottom:calc(var(--mobile-nav-height) + 24px)`

**Receipt** (replaces the toast) — `#toast.receipt[role=status][aria-live=polite]`, called as `toast(message,{undo}={})`. — Lane, in priority order: the dock register, replacing its readout while shown; the tray lane; the reader strip centre (wide rail); a 40px top lane under the safe area, used only in focus mode or Read · A paper strip with a perforated top edge, 13/500 text, an optional `key--text` "Undo", and a × key. Both keys are 44px · Slides up over `--t-fast`. Retracts after 4.5s or on tap, then becomes `hidden` (display:none), so no ghost text remains · Delete all five `#toast` bottom rules · Copy: "Bookmarked"; "Bookmark removed" (with Undo); "Copied"; "Reading copy removed"; "Added three sample pages. Map › All files links them."
### 6.2 Desk (E2)
**Root:** `content.className='desk-main'` with an inner `div.desk{container:desk/inline-size}`. — `h1.sr-only` "Desk" is the only `h1` (themes.cjs reads `h1`) · `.desk-masthead` (dock mode only, 64px): the wordmark at `--fs-mast`, with `button.key.key--icon.prefs-key[data-action=settings][aria-label="Reading preferences"]` on the right

**Sheet** — `article.resume-sheet.paper.paper--grain.paper--lit.paper--fold`, padding 22/22/20. — **Stamp:** "41 min · 9 sections". Append " · <filename>" (middle-ellipsis) only when `!sameName` · **`h2` title:** Fraunces `--fv-title`, wght 480, line-height 1.08, `text-wrap:balance`, 4-line clamp. Size follows the container: 32px under 540, 28px at ≥540, 36px at ≥760 · **`p.resume-lede`:** `analysis.lede` in the reading face, italic 16/1.5, `--muted`, 2-line clamp · **`button.key.key--plate.resume-key[data-action=document][data-id]`:** a pip plus "Start reading" when there is no progress. Otherwise "Resume at §2 · 19%", using `sectionAt` · **`button.ribbon`:** top right, 28px from the fold · **`.fore-edge`** (aria-hidden): a 10px band down the right edge, below the fold. It shows 50 stacked hairlines: a repeating mask over `linear-gradient(var(--lamp) 0 var(--p),var(--rule) 0)`, where `--p` is the progress

**Contents** — `nav.desk-index[aria-label="Contents"]`: a `.group-label` "Contents", then up to 7 `button.desk-section.row[data-action=desk-heading][data-id][data-anchor]`. — Rows come from the h2s, or the h3s when there are no h2s. Never the title h1 · Each row: `.section-number` (Plex 12 "01"), `.section-title` (14px, 2-line clamp), `.leader`, `.section-at` (Plex 12 "38%", line ÷ lines) · The row holding the reading position gets `aria-current="location"`, a lit pip and `translateX(-6px)` · "+N more →" (`data-action=desk-contents`) opens the reader with Contents · `key--text` "Map this file →" (`data-action=desk-graph`)

**Layout** — At `@container desk (min-width:540px)` the Desk becomes a spread: `grid-template-columns:minmax(0,3fr) 24px minmax(200px,2fr)`. The middle column is the crease: `linear-gradient(90deg,transparent,#ffffff09 48%,#000c 50%,#ffffff09 52%,transparent)` · Below 540px, Contents stacks under the sheet as 48px rows

**Also on the shelf** — `section.desk-register`, dock mode only (the tray lists these in tray mode). — A `.group-label` and an `ol` of up to 6 `deskRow(d,i)` rows: `li > button.file-card.slip[data-action=document][data-id]` · Each row has a CSS-counter numeral (Plex 12 `--subtle`), a `strong` title (15/500, 2 lines), the stamp "12 min · 3 Oct", and an unlit heading ruler (§6.3) · Closes with `key--text[data-action=library]` "More on the shelf" + an aria-hidden →

**Topics** — `p.desk-topics`: a `.group-label` "Topics", then a run-in index of `.tag-mark` "#ideas" + `span.tag-count` "3", joined by " · ". Up to 12, most used first, each once.

**Removed:** the N FILES eyebrow, the "Reading desk" text, the heading Open file, the desk search row and its kbd, ↗, the fileCard string-replace, the `#000` dog-ear, the star, `.resume-progress`.

**Motion:** keep the anime stagger on `.resume-sheet,.desk-index,.desk-register,.desk-topics,.desk-empty`.

**Empty Desk** — Dock mode shows the masthead. Tray mode shows an aria-hidden imprint: Fraunces italic 72 "Nightwire" at 6% alpha · `p.desk-empty-line`: Fraunces italic 20 `--muted`, "Nothing under the lamp yet." · `button.slot.slot--large[data-action=import]` "Open a Markdown file". Fine pointers add "or drop one here". This is the only drop target · `key--paper[data-action=paste]` "Paste text", drawn as a ruled slip · `key--paper[data-action=sample]` "Three sample pages", drawn as three fanned edges · Placement: the bottom third on phone (`margin-top:auto`), centred on wide
### 6.3 Shelf (E2)
**Header:** `h1` "Shelf" (`--fs-page`) + `span.stamp` "5 files" (or "2 bookmarked" while filtered).

**Controls**, in one row that wraps on phone: `label.field` "Filter by name or #tag" (`#library-filter`), no lens · `div.slide[aria-label="Sort files"]` with `[data-action=sort][data-sort=recent|name|size]` "Last read · A–Z · Size". Persisted in `state.sort` · `button.rocker[data-action=starred-only][aria-label="Bookmarked only"]`. This is how bookmarks are reached on phone

**List:** `ol.shelf-list{container:shelf/inline-size}`. 1 column below 700px, 2 columns at ≥700px.

**Card** — `li.shelf-card.paper`, holding two sibling buttons (this fixes the nested-interactive bug):
1. `button.file-card[data-action=document][data-id][aria-label="Read <name>"]`: `strong` title, 15/500, 2-line clamp; Stamp "Reading systems.md · 1 min · 3 Oct", each segment `nowrap`; `.ruler`: a 64×20 SVG fingerprint, unlit. One tick per heading of level ≤3, heights 14/10/6, x = line/lines, 1.5px `--subtle`; `.punch`: 20 holes of 5px. `round(progress×20)` are punched with a `--lamp` rim; the rest are `--rule` dots.
2. `button.ribbon` at the right edge.

Card details: A punched eyelet sits top-left, and a 1px `--rule` rod (`.shelf-list::before`) runs through the eyelets of each column · Odd cards are offset 2px to the right, so the stack looks fanned · A pressed card rises 3px (`translateY(-3px)`) · Tags show only when the filter starts with `#`, and then only the matching tag

**Empty states:** No files: "Nothing filed yet." + "Use the .md slot to open a file." · No bookmarks: "No bookmarks yet. Tap the ribbon on any card." · No match: "No files match ‘x’." (reading face, italic 17)

**Delete:** the select, drop zone, hint, `.md` emblem, chevron, nth-child colours, per-card tags.
### 6.4 Reader (E3)
`openDocument()` sets `state.returnTo=state.view` when the view is home, library, graph or terminal.

**Strip** — `div.reader-toolbar` (keep the class; tests measure it). Sticky `top:0`, z 20, `#000`, 1px `--rule` bottom border, height 48px + `env(safe-area-inset-top)`.

Left to right: (1) `key--text.strip-back[data-action=back][aria-label="Back to <Place>"]`: back glyph + Desk, Shelf, Map or Read. (2) `.strip-title`: the filename in Plex 13 `--muted`, middle-ellipsis. Once the h1 leaves the viewport (IntersectionObserver) it becomes the running head "§2 Find the signal" (13/550). (3) `key--icon[data-action=find][aria-label="Find in this document"]`. (4) `[data-action=outline][aria-label="Document outline"]`, hidden while the contents rail is visible. (5) `[data-action=more][aria-label="More document tools"]`. (6) `button.chain[data-action=focus][aria-pressed][aria-label="Enter focus mode"|"Leave focus mode"]`: a 44×64 hit area drawn as 9 beads plus a pull bead. Tap only.

Behaviour: **Phone:** hides on scroll down (`translateY(-100%)`) and returns on scroll up. It never hides while it or find holds focus, while find is open, or under reduced motion · **Wide:** always visible · **Offsets:** a ResizeObserver writes `--strip-h`. Headings get `scroll-margin-top:calc(var(--strip-h) + 16px)`, and find sticks at `top:var(--strip-h)` · **Delete:** `.progress-line`, `#reading-progress` and every fixed offset

**Layout** — `.reader-layout{container:reader/inline-size}` holds `.document-container` and the contents rail. — Text column: `max-width:66ch` · Phone padding: `--gutter` on the left, 24px on the right (clears the rail) · At ≥600px: 64px left (numerals and rail), 24px right

**File label** — `div.file-label`, a paper slip with a perforated left edge, padding 10/14. — Inserted after the first `#markdown > h1`, or at the top if there isn't one. It is on the find TreeWalker's reject list · It holds: the `.stamp` "86 words · 1 min"; the type slug; `.tag-mark`s; a `details.frontmatter` with summary "1 property" / "n properties", a glyph-chevron marker that turns 90° when open (native marker hidden), and a Plex 12 `dl` · This replaces the three boxes above the title

**Prose** (`ui/prose.css`). All colours come from `--read-*`. — **Body:** `--reading-font`, `var(--font-size)`, `var(--reader-leading)` · **Headings:** the reading face, with no rules and no per-level colours

| Level | Weight | Size | Extra |
|---|---|---|---|
| h1 | 650 | 1.9em | line-height 1.12 |
| h2 | 600 | 1.35em | 2.2em above |
| h3 | 600 | 1.1em | |
| h4–h6 | 600 | 1em | |

- **Numerals** (CSS counters): h2 shows `counter(h2,decimal-leading-zero)` in Plex 12 `--lamp`; h3 shows `counter(h2) "." counter(h3)` in Plex 11 `--subtle`. They hang in the margin at ≥600px and sit inline below that.
- **Links:** `--read-link`, with a 1px underline at offset 3. The underline is `--lamp` in Nightwire and the theme link colour elsewhere.
- **Blockquote:** no box. 1.2em indent, `--read-muted`, and a hanging Fraunces italic “ at 64px in `--lamp-dim` (pseudo-element).
- **Callouts:** JS sets `data-callout` (lowercase) and a sentence-case `.callout-label` (13/600); note: a paper slip; tip: a slip with a 12px folded corner; warning: a slip with a 6px left hatch, `repeating-linear-gradient(-45deg,var(--warn) 0 3px,transparent 3px 7px)`; danger, caution, error: the same hatch in `--danger`; Anything else: note.
- **Code:** `pre` is a well: `#050505`, `inset 0 2px 4px #000`, 1px `--rule`, radius 2, `--code` 14px, padding 34/16/16; `.code-label`: a lowercase language tab on the top-left edge, Plex 11 on `--ink-3`; `.code-copy`: a 44×44 tab on the top-right edge, aria-label "Copy code block"; Inline `code`: `--code` at .9em on `--ink-2` with a 1px `--rule`.
- **Tables** (`.table-wrap`): Booktabs rules in `--rule-2`: 1.5px top, .75px under the header, 1.5px bottom. No vertical rules; `th` at 13/600; `td.num` (set by JS on numeric cells): Plex, tabular, right-aligned; Sticky first column. `.is-scrollable` adds an edge fold shadow.
- **Tasks:** `.task-check` is a drawn 18px box; `[data-done]` adds a tick mask in `--lamp`. Keep the existing aria-labels.
- **Inline marks:** `#tags` outside code, pre and links become `.tag-mark`. `hr` becomes `.perf`.
- **Find hits** (`mark.find-hit`): a marker band, `linear-gradient(transparent 55%,rgb(var(--accent-rgb)/.45) 55% 92%,transparent 92%)`. `.current` raises it to .7 and adds a 2px `--lamp` outline.

**Source view** — `#markdown.source-view`, set in `--code`. — The gutter is a punched ruler: Plex 11 `--subtle` numbers, with a perforation dot every 5th line · Markdown syntax (`#`, `**`, `[[ ]]`, `>`, `-`, backticks) is wrapped in `span.md-syn` and coloured `--hue-2`

**Theme** — `applyReaderTheme(settings,palette)` now receives the whole palette. — In the Nightwire theme, headings and `link` are `#e3e9e6`, `italic` is `#c5ceca`, and keyword/string/number use `p.secondary`, `p.accent` and `p.tertiary` · The other five themes are unchanged

**Progress rail** — `div.progress-rail`, a sibling of `.reader-layout`.
- **Phone:** fixed at `right:8px`, spanning from the strip bottom (or 0 while the strip is hidden) to `--mobile-nav-height`; aria-hidden with `pointer-events:none`, so it never fights the edge back-gesture; A 3px `--rule` track with a `--lamp` fill and a 6px notch per h2; A 14×28 paper tab ("§2", Plex 11) rides at the current position.
- **Wide:** sits in the left margin as `role=slider`, aria-label "Reading position", aria-valuetext "Section 2, Find the signal, 19%"; Drag uses pointer capture. ←/→ move ±2%; PgUp/PgDn jump a section; Hit area 44×56.

**Contents**
- **Phone:** `openPanel('Contents',…,{size:'bottom'})` with rows `button.row[data-action=heading][data-anchor]`; Rows indent 0/14/28 by level; Each row: `.row-num` (source line, Plex 11), title (15px; 550 for h2, 450 below), `.leader`, and `.row-end` (%); The current row gets a pip and `aria-current=location`.
- **Wide:** `aside.reader-outline`, sticky, 200px wide, at `@container reader (min-width:700px)`. The 830px foldable qualifies because the reader uses the rail. Rows are compact (13px), followed by "Links & backlinks (n)".

**Tools** — `more()` → `openPanel(<filename>,…,{size:'bottom',width:380})`. The title is set in Plex 13; this is the only place the filename appears. Each group starts with a `.group-label`:
- **Mark:** `key--row[data-action=star]` "Bookmark this file" / "Remove bookmark" with the ribbon glyph, seated when on.
- **Read:** `[data-action=document-terminal]` "Open in Read".
- **Look:** `div.slide[aria-label="Page view"]`: "Formatted" (`[data-action=source][data-source=off][aria-label="Read formatted Markdown"]`) and "Source" (`[data-source=on][aria-label="View Markdown source"]`); `[data-action=document-graph]` "Map this file"; `[data-action=links]` "Links & backlinks" with a Plex count.
- **Take away:** "Export Markdown copy", "Export analysis JSON", "Copy Markdown text".
- **Settings:** `button.prefs-key[data-action=settings]` "Reading preferences".
- **Remove** (after a `.perf`): `button.key.hold-key[data-action=remove-hold]` "Remove from shelf", with the note "Removes the reading copy, bookmark and position. The original file stays where it is."; Holding for 650ms sweeps a 25% `--danger` fill across the key, then removes. Releasing early drains it; Tap, Enter or Space arms it instead: the label becomes "Tap again to remove" (announced), and a second activation within 3s removes. It resets after 3s; Under reduced motion only the two-step works; Calls `feedback('confirm')`; Delete `confirmRemove`.

**Links sheet** — `references()`, titled "Links & backlinks", with "Outgoing (n)" and "Backlinks (n)". Each href is Plex 11 `--subtle`. No inline styles.

**Find** — `div.find-bar`: `#find-input`: aria-label "Find in document", placeholder "Find on this page", 15px · `#find-count`: Plex 13, "03 / 12" or "No matches" · "Previous match" and "Next match" keys (up/down glyphs) and "Close find", all 44px

**End** — `.document-end` (`align-items:center`): a `.perf` tear, the stamp "6 sections · 3 links out", `key[data-action=top]` "Back to top", and `key[data-action=document]` "Next on the shelf: <title> →". That last key opens the next file in the current sort and is omitted when there is none.

**Lamp only** — `body.focus-mode`, toggled by the chain. Everything is hidden except the text and the chain, which stays fixed top-right within the safe area. Esc exits. No falloff overlay.
### 6.5 Search & dialogs (E4)
**Phone** — `#search-dialog.sheet`, full height. — `.search-results` takes `flex:1`; short lists sit at the bottom · `.search-field` (56px) is pinned at the bottom: the search glyph; `#search-input`: aria-label "Search all files", placeholder "Words, a filename or #tag"; `key--icon[data-close][aria-label="Close search"]` · The WebView resizes for the keyboard, so the field rides on top of it. Fallback: if `visualViewport.height < innerHeight-80` while focused, add `.search--top` to put the field first

**Wide** — a 560px paper column under the tray search key: left = tray width + 24, top 24, max height 80dvh, field on top. No centred palette, glow or blur.

**Meta** — `#search-meta`, Plex 12 `--muted`, showing one of: "Indexing 2 of 5" · "3 files" / "1 file" · "2 files tagged #reading" · "Where you were" (empty query)

Delete the footer, ESC and ON DEVICE.

**Result** — `button.search-result.row[data-action=search-open][data-id]`: `.row-num`: the line of the first hit, as a ledger column (Plex 11 `--subtle`) · `strong`: the title, 15/550 · `.result-path`: "Field notes › Find the signal", 12.5 `--muted` · `p.result-snippet`: reading face 15/1.45, 2 lines, `<mark>` on hits · A Plex 11 filename, only when `!sameName`

Tapping keeps today's behaviour: the document opens with find pre-armed.

**Worker** — Keep each document's raw text · Return `{id,title,name,line,section,parts:[{t,hit}]}`: `line`: 1 + the number of newlines before the first hit; `section`: the last heading at or before that line; Snippet: a ~190-character window of `body`, cut at word boundaries with "…", with headings joined by " · " · Build the DOM from `parts` using `textContent` only

**States** — Empty query: up to 6 recent documents, each with its title and "§2 Find the signal · 19%" · No results: "Nothing found for ‘x’. Try fewer words or a #tag." · Pending: "Indexing your files… the search runs when it’s ready."

**Paste panel** (`size:'full'`), titled "Paste text". — A filename tab on the sheet edge: `#paste-name` (Plex 13, label "File name") · `#paste-body`: a ruled textarea in the reading face at 16px · `key--text[data-close]` "Cancel" and `key--plate[data-action=save-paste]` "Open text" (pip, no arrow)

**Licences panel**, titled "Open-source licences": the library list in Plex 12, then `pre.license-text` in Plex 11/1.5 `--muted`.

`ui/dialogs.css` owns `.panel-actions` and the panel text.
### 6.6 Preferences & Type case (E5)
**Preferences** — `preferences(tab)` → `openPanel('Preferences',…,{size:'full',width:400})`. — On phone, Close sits at the bottom. On wide, the side sheet uses backdrop .35, so the live page stays visible and updates · Default tab: 'read' when `state.view==='terminal'`, otherwise the last tab used this session, otherwise 'page'. `Nightwire.debug.preferences(tab)` forwards the tab for the shots harness

**Tabs** — `div.prefs-tabs[role=tablist]` with `button[role=tab][aria-selected][aria-controls]`: Page · Type · Light · Read · Touch. — They are index-card notch tabs; the active one is raised 4px with its pip lit · ←/→ moves between tabs · Panels are `section[role=tabpanel][hidden]`, each about one screen tall

**Page tab**
- `.reader-theme-grid` fans out six `button.reader-theme-option[data-action=reader-theme][data-reader-theme][aria-label="<Name> reading theme"][aria-pressed]`; Each is a 96×128 mini page painted with that theme's colours via inline `--p-bg/--p-text/--p-h/--p-link/--p-code` from `readerThemes`: a heading bar, three text lines, a link, a code chip and a quote rule; Fan step `(100%−96px)/5`, so the fan never overflows horizontally; The selected page rises 10px and gets the pool.
- `#reader-theme-name` with its description.
- `button.rocker[data-action=reader-black][aria-label="Pure black page"]`. When it is on, the mini pages turn black live.

**Type tab** — `#font-preview`: a `p` in `--reading-font` at 22px, showing the lede's first sentence or, failing that, "The quiet part of the page is where the reading happens." · `#reading-font-name` and `#reading-font-description` · `key--row[data-action=typefaces]` "Open the type case →" · A `.ruler-row` for text size: `[data-action=font-down][aria-label="Decrease text size"]`, `input.ruler#setting-size` (13–26, step 1, aria-label "Text size"), `[data-action=font-up][aria-label="Increase text size"]`, and `output#font-value` "17 px" · Line spacing: `input.ruler#setting-leading` (1.5–2.2, step .05, aria-label "Line spacing") with a readout · Both apply live

**Light tab**
- `.palette-grid`: a gel strip on `--ink-1` holding 9 `button.palette-option.gel[data-action=palette][data-palette][aria-pressed]` (aria-labels "<Name> palette" and "Custom accent palette"); Each gel is a 36px lens (a radial gradient of its colour) in a 44px hit area. The custom lens shows the stored custom colour; Unlit gels sit at 45%. The lit gel is full strength with a 1px ring and a core; Layout: 5 + 4, or one row when the strip is ≥444px. Pressed travel is 2px; `#palette-name` sits below.
- `.dimmer` (168px): A conic ring through 24 `hueColor()` stops (built in JS) with a knurled rim; `div.dimmer-ring[role=slider][tabindex=0][aria-label="Custom accent hue"][aria-valuemin=0][aria-valuemax=359][aria-valuenow][aria-valuetext="Hue 218, #91B7FF"]`; The pointer shows the *stored* custom hue and is lit only while custom is active; The face holds `input#custom-hex` (Plex 13, aria-label "Custom accent hex colour"). With a preset active it shows "preset: Signal lime"; Drag uses pointer capture and atan2. Detents every 15° fire `feedback('selection')`; Keys: arrows ±5, PgUp/PgDn ±15, Home 0, End 359; Hint: "Turn to tint".
- `div.slide[aria-label="Colour intensity"]` with `[data-action=intensity][data-intensity]`: "Quiet · Balanced · Vivid".

**Read tab** — E7's `stylePicker()` · `.word-alignment-setting`: `div.slide[aria-label="Word alignment choices"]` with `[data-action=word-alignment][data-word-alignment=fixed|center]` ("Fixed word origin", "Centred word frame"), each drawn as a word frame (a left guide or a centre tick), plus `#word-alignment-description` · In Read only: `key--row[data-action=terminal-blackout]` "Blackout reading", with the note "Only the words on black. Tap to return."

**Touch tab** — Rockers: "Touch feedback" (`haptics`), "Higher contrast" (`contrast`), "Motion" (`motion`) · About: "Nightwire 0.x" (Plex), then "Everything stays on this phone. No account, no network." (said once, only here), then the reading-style credits · `[data-action=licenses]` "Open-source licences →"

**Delete:** the eyebrows, "Appearance", the counts, every select, the palette preview, the "Field notes" specimen, the footnotes, and the pipette and align icons.

**Default face:** `defaults.font='literata'`. `migrateSettings()` (E5 writes it; E0 calls it once before the first `applySettings()`) runs once: a stored `'sans'` without `typeV2` becomes `'literata'`, and `typeV2` is set. "System sans" stays available in the Type case.

**Type case** — `typefaces()` → `openPanel('Type case',fontRackMarkup(…),{size:'full',width:560})`. — **Proof strip:** `#rack-font-name` + the document's first sentence in the selected face at 24px, updated live · **Controls:** sticky `top:0` on solid `--ink-1`; `label.field.field--search` holding `input#font-rack-search[type=search][aria-label="Find a typeface"]`; Drawer pulls `button[data-font-group=all|sans|serif|mono|accessible][aria-pressed]`: All · Sans · Serif · Mono · Legibility. Keep the current aria-labels · **Grid:** `.font-rack-grid` compartments, 3 columns under 520px and 5 above. 1px gaps over a `--rule` background act as hairlines. No radius · **Cell:** `button.font-option[data-action=choose-font][data-font][aria-label="Use <Name>"][aria-pressed]`; A 34px glyph pair in `--specimen-font` (aria-hidden), with the name at 13px in that face; Legibility faces carry a stamped "L"; The selected cell is seated with its pip lit · **Glyph pairs:**

| Face | Pair | Face | Pair | Face | Pair | Face | Pair |
|---|---|---|---|---|---|---|---|
| sans | Aa | serif | Qg | source | Rt | literata | Qa |
| atkinson | Il1 | plex | 0O{} | inter | R4 | dm | Gy |
| work | Rk | nunito | ag | lora | Ag | newsreader | fi |
| alegreya | Th | crimson | ffl | fraunces | &g | jetbrains | -> |
| space | @# | opendyslexic | bdpq | lexend | aG | roboto | 0Ø |

- `#font-rack-empty` reads "No typeface matches ‘x’."
- **Delete:** the serials, "Aa 012.", the pangram, the glyph line, and PAGE + READ.
### 6.7 Map (E6)
**Layout** — `.graph-main` is a grid with rows 52px / 1fr / 52px, the same on every width. — On phone it spans from the safe top to the dock. On wide it fills the full height beside the full tray · The plate has a 52px right rail outside the canvas

**Top rail** — `button.map-file[data-action=graph-files]`: a paper tab, "Signal protocol ▾" (14/550). It opens "Choose a file" with `[data-action=graph-pick][data-id]` rows and replaces the `#graph-file` select · `div.slide[aria-label="Graph scope"]` with `[data-action=graph-scope][data-scope=document|all][aria-pressed]`: "This file" and "All files"

**Plate** — `.graph-frame > #graph-canvas`. — Top-left overlay: `h1.plate-stencil` "Map" (Plex 12 `--muted`) and `#graph-count` ("9 nodes · 8 links", plus "· first 450 shown" when capped) · Four CSS crop marks · A grid drawn in `onRenderFramePre` in graph coordinates: `--rule` dots every 40 units, fading out below zoom .6

**Right rail:** `key--icon` keys "Zoom graph in", "Fit graph to screen" and "Zoom graph out".

**Bottom rail:** three rocker-styled `button.graph-toggle.key[data-action=graph-filter][data-filter=headings|tags|links][aria-pressed]` ("Headings graph layer", "Tags graph layer", "Links graph layer"). — Each has a label, `<i data-graph-tally=heading|tag|link>`, and a 10×3 cable stub in `--layer-color` · The tallies count heading nodes, tag nodes and `reference` edges. Resolved links count as links · No legend

**Nodes** (keep solid fills; tests sample exact pixels) — document: a grommet, ring in `p.accent`, r 7, hole r 3 · h2: a 16×11 `p.secondary` tab with a black Plex numeral; a 5px square below zoom 1 · h3+: a 3px `p.secondary` tick · tag: a `p.tertiary` pennant · Unresolved link: an open ring with a 60° gap · Level of detail: below zoom .6, or above 300 nodes, draw plain dots and straight edges

**Edges:** `linkCanvasObject` draws orthogonal elbows (source → (midX, sy) → (midX, ty) → target) in 1px `--rule`. The selected neighbourhood uses `--lamp-dim`.

**Labels** — `ctx.font` = `` `${11/scale}px "NW Plex Mono"` ``, set after `document.fonts.load` · No `#000d` plates · Collision checks include the node discs (r+4), the stencil rect and the tag rect · Heading labels keep `mix(color.heading,'#bac9bf',.55)`; navigation.cjs detects that ratio

**Taps**
- A heading opens its section immediately. This is kept from 0.2.1 and pinned by tests; it is not two-tap.
- A file, tag or link is selected instead. Everything else dims to 20% and `#graph-selected.map-tag` appears: Phone: a full-width paper tag rising from the bottom rail. Wide: anchored at the plate's bottom left, ≤360px; It holds the label in "NW Newsreader" 17; the kind and parent, e.g. "File · 6 sections" (12.5 `--muted`); up to 6 neighbour `.tag-mark`s; one `[data-action=graph-open]` key ("Read file", "Search tag", "Open link" or "Open target"); and a × key.
- When nothing is selected, nothing is shown.

**Updates** — Toggles update in place: `graph.graphData(data)` + `updateGraphBoard`, with no `resetGraph`. Zoom and focus survive · `graphFitPadding()` reserves the stencil band (28px) and the open tag

**Accessibility:** an offscreen `ul.sr-only[role=tree][aria-label="Map outline"]` lists file → sections → tags. Enter on an item acts like a tap.

**Empty state:** "Make a connection." (Fraunces italic 22) + "Open a Markdown file. Its structure draws the map."

**Delete:** the trace header, ⌁, STRUCTURE PLATE, "Trace.", Add files, SOURCE CARTRIDGE, the rulers, grille, LEDs and legend, PAN / PINCH, the idle inspector, the pointer icon, and the old graph rules.
### 6.8 Read (E7)
The instruments keep their markup, ids, artwork, layouts and playback. Only these changes are allowed.
1. **Light is the user's accent.** Delete the `--accent*` overrides in cyberdeck, phosphor, mixtape, orbital and nocturne CSS. The OLED word, bionic prefix, LEDs, active switch and needle tip then inherit the user's tokens; The plastics stay (`--deck-yellow` and the rest); Accent text on light plastic switches to the instrument's ink; Classic keeps `--index-accent`, which follows the Page palette.
2. **Labels.** Delete NW / FIELD READER, PORTABLE / LOCAL, OFFLINE / ON DEVICE and every "NIGHTWIRE / …"; Where the slot shapes the layout, fill it with a live serial plate: "Signal protocol.md · 86 words · 18 s left"; Captions: ≥11px, sentence case, tracking ≤.04em; `--mono` is now Plex, so re-run the 66-layout suites; No per-instrument default faces. Page and Read share one typeface (README, font-sync.cjs).
3. **Blackout key.** `#terminal-blackout` keeps the aria-label "Blackout reading"; its moon icon becomes the visor glyph.
4. **Phone Cyberdeck.** The aperture takes about 38% of the height, with the word optically centred. The freed height goes to the shelf, and the switchbank fills its column with no ~80px gap.
5. **Playback.** `createTerminal({…,onPlaying})` calls `setDockCollapsed(true)` on play and `setDockCollapsed(false)` on pause.
6. **Shell bridge.** Remove the `read-styles.css` remap of `--accent/--line/--muted/--text` on `.mobile-nav,.sidebar`; `ui/read-shell.css` sets only material variables per `body[data-terminal-presentation]`: `--key-face`, `--key-edge`, `--key-ink`, `--key-radius`, `--slot-face`, `--slot-ink`. Port the old nav-dock block values to both the dock and the rail; `syncNavigation()` passes material tokens only.
7. **Picker.** `stylePicker()` → `div.read-style-gallery.cartridge-shelf[role=group][aria-label="Read style"]`; A horizontal scroll-snap row on phone; 2 columns on wide; Each `button.read-style-card[data-read-style][aria-pressed]` shows a 150×110 miniature, a Plex 12 name plate, and one plain line at 12.5 `--muted`; The seated card drops 8px with its pip lit; Delete the select and the stale "Index/Nightwire" copy.
8. **Empty Read** (`.terminal-empty`): h1 "Read", the line "Load a Markdown file with the .md slot to read it word by word.", and `key[data-action=paste]` "Paste text". Keep `.terminal-empty-help` and `.terminal-no-prose`.
9. **File chooser** (`terminalFiles()`): rows become `.row`. Keep the "Read <name>" labels and "Open another file".
## 7. The user's screenshot: wide Desk, 830×714, mint, 5 files, 19%
1. **Top bar deleted.** Gone with it: WORKSPACE / HOME, the magnifier, the sliders and the glowing mint "Open file"; Also deleted: the "5 FILES / Reading desk / Open file" row and the "Search your files Ctrl / ⌘ K" row; The sheet now starts 28px from the top.
2. **The tray is 212px.** It holds the wordmark (no "NL" monogram, no MARKDOWN READER), Search (no ⌘ K on touch), and Desk / Shelf / Map / Read with Desk seated and its mint pip lit; Below those come the cards, the slot and Preferences; Deleted: LIBRARY, RECENT FILES, the Bookmarked route, the "5" badge, "+", LOCAL / OFFLINE, "Reading preferences >", and "NW / v0.9 NO VAULT REQUIRED".
3. **Clipped recents, fixed.** **Cause:** `.sidebar` is a fixed flex column. Its only shrinkable child is `.sidebar-recents{flex:1;overflow:auto}`, which has no min-height. ~620px of fixed blocks crush it to a ~10px sliver, and the scroll edge cuts through glyphs; **Fix:** every other block is `flex:none`. They total 12+48+44+6+176+8+8+52+44+8 = 406px, which leaves 308px. The ResizeObserver clamps the cards to ⌊308/56⌋×56 = 280px, so all 5 cards are whole, with snap and the lip; The card reads the title, "human_me…research.md" (Plex 11), and a 19% filament.
4. **Main column ≈617px**, so `.desk` is ≥540px and lays out as a spread; **Sheet (~330px):** Fraunces 28px title (4-line clamp), a 2-line standfirst, and the stamp "41 min · 9 sections". "LAST OPENED", the duplicate filename and "74.4 KB" are gone; The ribbon replaces the bookmark icon; The fore-edge (10 of 50 lines lit) replaces the 68×2px bar; "Resume at §2 · 19%" with a mint pip replaces the glowing pill; The fold is real; **Contents page (~215px):** "01 Executive summary …… 0%" onward, all above the fold. The 19% row protrudes, lit; "Also on the shelf" is hidden because the tray already lists those files. Topics follow the spread.
5. **One hue.** The cyan underscore, cyan icons and green-cast surfaces are gone. Mint now appears only as light: pips, fore-edge, current row, filament and one pool. Any other gel recolours all of it.
## 8. Non-negotiables and the test contract
**Every feature stays reachable**

| Feature | Where |
|---|---|
| Open | slot (dock or tray), empty Desk, drag and drop, Read chooser |
| Paste and samples | empty Desk |
| Search | dock or tray key, Ctrl/⌘ K |
| Find | strip, Ctrl/⌘ F |
| Contents | strip, rail, Desk |
| Source, map, Read, export, copy, links, remove | Tools |
| Bookmark | ribbon or Tools; the bookmarked list is the Shelf rocker |
| Focus | chain, Esc |
| Preferences | phone Desk masthead, wide tray or rail, reader Tools, instrument key (exactly one visible at a time) |
| Typefaces | type slug, Prefs › Type, instruments |
| About and licences | Prefs › Touch |

**Quality bars** — Touch targets ≥44×44. Visible focus (§4) · Offline: Zero requests outside the app origin; Bundled fonts only; Only `data:` URIs in CSS; No new libraries · Reduced motion per §3.4, from both the OS and the app setting · AA contrast. 11px text only in Plex at `--subtle` or brighter · `env(safe-area-*)` on the strip, dock, sheets and chain · 320–1280px wide with no horizontal page scroll · `tests/contrast.cjs` (E0, port 8804): Pairs: tokens on #000 and on `--ink-2`, plus `--accent-ink` on the accent; Accents: the 8 presets plus #ff00ff, #ffff00 and #3030ff; Intensities: all 3 · On-device QA at 5% brightness: one lit thing per region

**Accessible names that must stay exactly** — **Navigation:** "Main navigation" · **Shell and panel buttons:** "Search", "Read", "Open Markdown files", "Close panel", "Close search", "Close find" · **Reader buttons:** "Find in this document", "Document outline", "More document tools", "Bookmark this file", "Export analysis JSON", "View Markdown source", "Read formatted Markdown", "Enter focus mode" / "Leave focus mode", "Copy code block" · **Preferences buttons:** "Choose reading typeface", "Reading preferences", "Increase text size", "<Name> palette", "Custom accent palette", "Vivid", "Balanced", "<Name> reading theme" · **Map buttons:** "Tags graph layer", "All files", "Zoom graph in", "Fit graph to screen", "Read file" · **Other buttons:** "Bookmark <file>" / "Remove bookmark from <file>", "Read <file>", "Exit blackout reading" · **Textboxes:** "Search all files", "Find in document", "Custom accent hex colour" · **Slider:** "Custom accent hue" · **Switches:** "Pure black page", "Touch feedback", "Higher contrast", "Motion" · **Searchbox:** "Find a typeface" · **Text:** "Make a connection."

**Ids, classes and attributes that must stay**
- **Ids:** Shell and dialogs: `#content`, `#markdown`, `#file-input`, `#panel-dialog`, `#panel-content`, `#search-dialog`, `#search-input`, `#search-meta`, `#find-count`, `#dock-context`, `#dock-count`; Map: `#graph-canvas`, `#graph-count`; Type and preferences: `#font-preview`, `#reading-font-name`, `#rack-font-name`, `#font-rack-empty`, `#reader-theme-name`, `#palette-name`, `#custom-hex`; Read: `#terminal-*`.
- **Classes:** Reader: `.markdown`, `.reader-main`, `.reader-toolbar`, `.source-view`, `.table-wrap`, `.callout`, `.task-check`; Search and Desk: `.search-result strong`, `.resume-sheet h2`, `.desk-register .file-card strong`, `.desk-section`; Shell: `.mobile-nav`, `.nav-key.active`, `.nav-search`, `.sidebar`; Map: `.graph-main`, `.graph-frame`; Type and preferences: `.font-option`, `.font-rack-grid`, `.palette-grid`, `.reader-theme-grid`, `.word-alignment-setting`, `.type-trigger`, `.type-trigger-name`; Read: `.terminal-*`, `.deck-*`, `.vibe-root`.
- **Attributes:** `[data-graph-tally]`; `[data-palette|reader-theme|read-style|word-alignment|intensity|font|font-group]`; every existing `data-action` value.

**Renamed or removed** (the test owner updates the test in the same change)

| Before | After |
|---|---|
| "Home", "Files", "Graph" | "Desk", "Shelf", "Map" |
| heading "Reading desk" | sr-only h1 "Desk" |
| "Terminal reading" | "Open in Read" |
| "Explore a sample" | "Three sample pages" |
| "Continue reading" | `.resume-key` |
| "Graph of this file" | "Map this file", in Tools (the Source slide also moves to Tools) |
| "Remove from recent files" + "Remove copy" | "Remove from shelf" hold key; tap twice |
| comboboxes "Reading typeface", "Read tab style", "Sort files" | `.font-option`, `[data-read-style]`, `[data-sort]` |
| `.top-actions [data-action=settings]` | the single visible `.prefs-key`; Tools › "Reading preferences" in the phone reader; `Nightwire.debug.preferences()` in Map tests |
| `#nav-count` | `Nightwire.debug.state().docs.length` |
| `#dock-count`, `#dock-context` | "% read", the document title |
| `#search-meta` "N MATCHES · ON DEVICE" | "N files" |
| `#graph-count` "N NODES / N CONNECTIONS" | "N nodes · N links" |
| `.graph-legend` | `.graph-toggle` `--layer-color` |
| `.topbar` | assert `.reader-toolbar` |

Other test changes: The reader has no `[aria-current=page]` · nav-dock geometry skips buttons with no client rects · navigation.cjs: `top≥122` becomes "below the bottom of `.reader-toolbar`" · `.press-wave` assertions become `.is-pressed` + transform · themes.cjs compares Nightwire syntax colours with the live `--read-*` values · Prefs tests click `getByRole('tab',{name})` first
