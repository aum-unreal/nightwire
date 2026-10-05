# Nightwire

An OLED Markdown reader for Android. Open a downloaded `.md` file directly, read it, search it, and explore its structure. No vault setup.

## Use it

Install `nightwire.apk` (Android 8+). In Downloads or another file manager, choose **Open with → Nightwire**. Alternatively, open Nightwire and push a file into the **.md slot**: the card slot in the dock (phone), the tray or rail (wide screens), the empty Desk, or the Read file chooser. The system picker can open several files at once. Sharing Markdown or plain text to Nightwire works too. In a desktop browser preview you can also drop a file onto the window.

The app keeps private copies of opened documents. Bookmarks and reading positions survive restarts. Removing a reading copy leaves the original file alone. Reopening identical content with the same filename reuses the existing copy; changed content gets a separate copy.

Nightwire has four places, **Desk, Shelf, Map and Read**, plus two actions that work everywhere: **Search** and **Open**.

- **Desk** shows the last file you opened as a folded paper sheet: its title, opening lines, reading time and a **Resume at §2 · 19%** key. A fore-edge of 50 hairlines lights up as you read. Its contents page lists up to seven sections with their position in the file, and **Map this file →** opens its map. On phone, "Also on the shelf" lists the next six files. Topics collects the most used `#tags`. The empty Desk offers **Open a Markdown file**, **Paste text** and **Three sample pages**.
- **Shelf** shows every file as an index card hung on a rod, with a heading fingerprint, a punched progress row and a ribbon bookmark. Filter by name or `#tag`, sort by **Last read · A–Z · Size**, and use the **Bookmarked only** rocker to see bookmarks.
- **The reader** has a 48px strip with Back, the filename (which becomes the running head, "§2 Find the signal"), Find, Contents, Tools and the pull chain for focus mode. On phone the strip and the dock slide away while you scroll down and return when you scroll up. A progress rail runs down the edge; on wide screens it is a draggable slider in the left margin, beside a contents rail. A file-label slip under the title holds the word count, the type slug, tags and frontmatter. Headings carry hanging numerals. Code sits in a well with a language tab and a Copy key, tables use booktabs rules, and callouts are paper slips.
- **Tools** (in the reader) holds: Bookmark, Open in Read, the Formatted/Source switch, Map this file, Links & backlinks, Export Markdown copy, Export analysis JSON, Copy Markdown text, Reading preferences and **Remove from shelf**. To remove a file, hold the key for a moment or tap it twice.
- **Search** covers every opened file with full-text fuzzy and prefix matching, plus `#tag` search. Results show the line, the section path and a snippet with the hits marked. An empty query lists where you were in your recent files. Opening a result arms in-document find with the same words. `Ctrl/⌘ K` opens it on a keyboard.
- **Find** searches the open document, with previous/next matches drawn as a marker band. `Ctrl/⌘ F` opens it on a keyboard.
- **Map** draws the headings, tags and links of one file or of all files on a plate with crop marks. Headings are numbered tabs, files are grommets, tags are pennants, and wires run as right-angled elbows. Tap a heading to open its section straight away. Tap a file, tag or link to select it: a paper tag lists its neighbours and offers Read file, Search tag or Open link. Three layer keys at the bottom show real tallies, and the right rail zooms and fits.
- Obsidian-style `[[wikilinks]]`, aliases, heading anchors, callouts, frontmatter, task lists, tables, and highlighted code.
- **Preferences** has five tabs. **Page**: a fan of six reading themes (Nightwire, Minimal, Catppuccin Mocha, Tokyo Night, Nord, Gruvbox) and **Pure black page**. **Type**: a live proof of the current face, the type case, and rulers for text size and line spacing. **Light**: eight gels (Signal lime, Glacier, Ultraviolet, Hot pink, Amber terminal, Ember, Mint circuit, Quiet night), a dimmer wheel for a custom hue or hex value, and **Quiet · Balanced · Vivid** intensity. **Read**: the Read style cartridges, word alignment and, inside Read, Blackout reading. **Touch**: touch feedback, higher contrast, motion, the about note and the open-source licences.
- The accent is the colour of the bulb. Every neutral surface is tinted from it, and it appears only as light: lit pips, progress filaments, the current section, the focus ring and one faint pool on the current object. Changing the gel or the custom hue recolours the whole app and the map at once.
- Keys travel 2px when pressed and stay seated 1px when selected. Optional Android haptics use standard view feedback and respect device settings. The Motion switch and the system reduced-motion setting turn off every animation and stop the strip and dock from hiding.
- Twenty reading typefaces, including OpenDyslexic, Lexend and Atkinson Hyperlegible Next. Literata is the default. The **Aa** type slug on the page and in every Read instrument opens the type case.
- Paste text into a new reading copy, and export an analysis JSON for use with a classifier outside the app.

Samples are added only when you ask for them, from the empty Desk.

## Scope

Nightwire is a reader. It does not edit original files. It does not require a folder grant or filesystem scanning. A graph connection means a heading relationship, shared tag, or explicit link; it does not claim semantic similarity.

Remote and relative images appear as placeholders. Remote image links open in the browser on demand. Embedded PNG/JPEG/WebP/GIF data images render locally. HTML is sanitized; scripts, frames, embedded media, styles, and document-authored app actions are removed. Reading makes no external requests. No API keys or classifier connections are bundled.

Limits: 8 MB of normalized text per file, 32 MB across stored reading copies, 450 visible graph nodes, and 2,000 highlighted find matches. The graph says when it is showing only the first 450 nodes. Search covers the full stored file. UTF-8 and BOM-marked UTF-16 are supported. Relative Markdown links resolve against uniquely named opened files; ambiguous or unopened targets prompt opening the target file. There is no directory or image-companion import in this version. Math and Mermaid are shown as source text/code.

## Shell: dock, tray and rail

There are no top bars. Phones, and landscape phones under 561px tall, get the **dock** at the bottom. It has a register line (the current file, its section and an odometer of % read), the Desk, Shelf, Map, Read and Search keys, and the `.md` slot on the right. The active key widens to show its caption with a lit pip. While you read, the dock folds to a 52px spine; tap **Show navigation** to bring the keys back. It never folds on Desk, Shelf or Map, under reduced motion, or while a key has keyboard focus. In Read the dock hides Search and the slot, because the instrument has its own.

Wider screens get the **tray** on the left (212px, or 248px from 1190px). It holds the wordmark, Search (with a `Ctrl K` chip on mouse-and-keyboard devices), the four places, recent files as whole 56px cards with progress filaments, the `.md` slot and Preferences. The reader and Read shrink it to a 76px **rail** of glyph keys.

Notices are **receipts**: a perforated paper slip that slides into the dock register, the tray, the reader strip or a top lane, with an optional Undo. They retract after 4.5 seconds and leave nothing behind.

Every control has a 44 × 44 px touch target, an accessible name and a visible focus ring. Safe-area insets keep the strip, dock, sheets and chain clear of system bars and cut-outs. Each view has exactly one Preferences entry: the Desk masthead on phone, the tray or rail on wide screens, Tools in the reader, and the instrument's key in Read.

## Terminal reading

**Preferences → Read** selects one of six reading instruments from a shelf of cartridges, each with a miniature of its layout. Each instrument has its own layout, typography, controls and artwork. Cyberdeck remains the default. Switching styles pauses playback and retains word position, speed, grouping and emphasis. The selected prose font remains shared.

| Style | Design |
|---|---|
| Classic | An archival index desk: filed source tab, staked reading card, theme-aware paper keys and engraved pace rule. |
| Cyberdeck | A moulded field handheld: recessed OLED aperture, source cartridge, yellow transport keys, grip rail and a low instrument shelf. |
| Phosphor | A command workstation: rectangular CRT buffer, shell filename prompt, indexed function keys and physical keyboard transport. |
| Mixtape | A cassette machine: cream Side A label, oxide tape path, progress-driven reels, enamel piano keys and knurled rate wheels. |
| Orbital | A spacecraft optical bench: asymmetric graduated progress arc, payload rail, clipped actuator keys and paired velocity/payload controls. |
| Nocturne | A bound midnight folio: linen spine, ribbon bookmark, vertical controls in the page margin and an engraved compositor row. |

Index follows **Preferences → Page**, including all six palettes and **Pure black page**. With Nightwire selected, its accent follows the eight interface palettes or a custom colour. Its paper keys, surfaces, metal ruler and miniature derive from that shared palette; colour intensity and higher contrast apply too. Typeface, position, WPM and grouping stay separate.

The dock and rail take the active instrument’s materials (key faces, edges and slot), while their light stays the user’s accent. The instruments’ own lights (the OLED word, bionic prefix, LEDs and needle tips) follow the accent too. Where a fake status label used to sit, a live serial plate shows the file, word count and time left. Artwork is local CSS/SVG. Reels, arcs, gauges and counters use actual reading progress or settings. Reduced motion disables entry and instrument movement.

Each module in `assets/read-themes/` owns its markup, stylesheet and settings miniature. `assets/read-theme-registry.js` registers the modules; `assets/read-styles.js` supplies the selector. The shared `assets/terminal-reader.js` controls playback and blackout. `assets/terminal.css` and `assets/terminal-screen.css` provide the base control and viewport rules; `assets/terminal-anchor.css` fixes word slots and baselines in Fixed mode and styles the alignment toggle; each instrument supplies its own compact and landscape layouts. `assets/read-styles.css` styles the cartridge shelf, and `assets/ui/read-shell.css` sets the dock and rail materials for each instrument. All fonts and animation code are bundled.

Open **Read**, or choose **Open in Read** in a document’s Tools. Choose one or two words per frame and set 80–1000 words per minute with the touch ruler, ±10 buttons or presets. **Preferences → Read → Word alignment** toggles **Fixed** or **Centred** for every Read instrument and blackout. Fixed remains the default, and the choice persists across files, themes and restarts. Changing it preserves word position, WPM, font, grouping and emphasis. Centred restores the previous whole-frame centring. In Fixed mode, each frame begins at a fixed left edge and baseline. Two-word mode reserves two fixed slots, so either word can change length without moving the next frame's start. Long words shrink within their slots while the baseline stays fixed. Bionic emphasis highlights the first half of each word; it can be turned off. All six instruments use the selected reading font.

Tap the **visor key** in any Read style, or choose **Blackout reading** in Preferences → Read, to show only the current words on pure black. This keeps the selected font, word colours, word alignment, bionic/plain emphasis, grouping, position and WPM. Entering blackout preserves whether reading is playing or paused. Android status/navigation bars hide while it is active. Tap anywhere, press Enter/Escape, or use Android Back to pause and restore the controls. Space can pause/resume on a keyboard. Backgrounding, changing files/tabs and opening search/preferences also leave blackout and pause. Blackout is a temporary session mode and does not reopen after a restart. Code-only files keep the visor key disabled.

Start/pause, step, restart, seek and switch files. Tap the filename to open the file chooser; playback pauses while the sheet is open. **Page** returns to the current section. Each file retains its own word position; speed, grouping and emphasis persist across launches. Playback pauses when opening search/preferences, changing tabs, opening another file or backgrounding the app. Resuming requires Start. Space toggles playback and arrow keys step when a control is not focused.

Frames use actual word counts: at 300 WPM, one word lasts 200 ms and two words last 400 ms. A late timer advances one frame without catching up. Headings, paragraphs, tables and link labels are read in source order; frontmatter, fenced code, raw HTML blocks and image references are skipped. Original Markdown and classifier input are unchanged.

## Architecture

The small native Java activity handles Android VIEW/SEND intents, the system file picker, private file storage, atomic metadata writes, clipboard, safe external-link opening, and export. File reads run on one background executor. The offline WebView interface runs at a virtual HTTPS origin intercepted by the activity. The activity serves only bundled assets and content-addressed document copies; other resource requests are blocked.

The interface uses plain HTML/CSS/JavaScript. `assets/core.js` extracts headings, links, tags, frontmatter, line numbers, and graph structure using Markdown-it tokens. `assets/search-worker.js` builds the MiniSearch index outside the main UI thread. Reading state is stored in WebView local storage; Markdown remains in private native files. IndexedDB provides the equivalent import/storage workflow when previewed in a desktop browser.

Planning focused on three decisions before expanding the interface: use direct Android content URIs instead of a vault; reuse mature render/search/graph libraries; and keep classifier input and output versioned and separate from reading state. The first version completes that reading workflow before adding a remote model service.

## Future classification

`classifier/index.ts` defines a strict, versioned `Classifier` interface and `ClassifierRegistry`. The app exposes `window.Nightwire.classifierInput(documentId?)` and `window.Nightwire.classifiers` for a future adapter. Inputs contain original Markdown, heading line numbers, tags, document identity, and the SHA-256 hash of normalized UTF-8 content. Output validation rejects unrecognized labels, invalid confidence values, a different task/document, and stale revisions. Provider, model, confidence, and optional source evidence remain explicit.

**Tools → Export analysis JSON** produces the same input as a portable `.analysis.json` file. It can be fed to a TypeSafe Jev integration or another classifier later. Jev is not connected in this version. The interface is an internal contract, not an imitation of TypeSafe's HTTP API. A production remote adapter should translate to the provider's current SDK in a trusted native service or local backend; the offline renderer deliberately permits only its own origin. Keep credentials out of Markdown and WebView storage.

Consult [TypeSafe's official documentation](https://docs.typesafe.ai/) when adding that adapter. `tests/classifier.test.cjs` exercises the registry and validation, including cancellation.

## Reused open source

Dependencies are pinned in `package-lock.json`; distribution files are bundled for offline use. Full notices for the libraries and graph dependencies are in `assets/THIRD_PARTY_LICENSES.txt`, accessible from Preferences → Touch → Open-source licences.

| Library | Role |
|---|---|
| [Markdown-it](https://github.com/markdown-it/markdown-it) | CommonMark/GFM parsing and rendering |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization |
| [MiniSearch](https://github.com/lucaong/minisearch) | Full-text fuzzy and prefix search |
| [force-graph](https://github.com/vasturiano/force-graph) | Canvas graph layout, pan, zoom, hit testing |
| [highlight.js](https://github.com/highlightjs/highlight.js) | Code syntax highlighting |
| [Lucide](https://github.com/lucide-icons/lucide) | Icons inside the Read instruments; the rest of the app draws its own glyph sprite |
| [Anime.js](https://animejs.com/documentation/animation/) | Short staggered desk transitions with cleanup and reduced-motion support |

`bezier-js` omits its license from its npm package; `scripts/licenses/bezier-js.txt` preserves the upstream MIT notice. The vendoring script also collects the bundled graph dependency licenses.

## Reading theme references

The reading presets adapt colour palettes and reading treatments from these projects to Nightwire’s Markdown DOM. They are inspired styles rather than installable Obsidian theme files. The bundled credits retain upstream notices; `scripts/theme-sources.json` pins their GitHub source blobs.

- [Minimal by kepano](https://github.com/kepano/obsidian-minimal): neutral type and restrained heading/quote borders. [Support the author](https://www.buymeacoffee.com/kepano).
- [Catppuccin for Obsidian](https://github.com/catppuccin/obsidian) and [Catppuccin palette](https://github.com/catppuccin/palette): Mocha colours with lavender, blue, green and peach heading levels.
- [Tokyo Night for Obsidian](https://github.com/tcmmichaelb139/obsidian-tokyonight): blue/violet headings and code on an ink background.
- [Nord](https://github.com/nordtheme/nord): frost links and slate surfaces.
- [Gruvbox](https://github.com/morhetz/gruvbox): amber/olive emphasis and warm text.

`assets/reader-themes.js` holds the adapted tokens; `assets/ui/prose.css` applies them to the reading surface. `scripts/vendor.cjs` bundles Anime.js 4.5.0 and all credits locally. Short entry animations run once when entering the Desk, revert their inline styles when finished, and stop when either app or OS motion is disabled.

## Type case

The **Aa** type slug shows the current typeface on the formatted page and in all six Read instruments. It opens the **type case**: a proof strip with the document's first sentence in the selected face, a search field, drawer pulls for All · Sans · Serif · Mono · Legibility, and a grid of compartments, each showing a characteristic glyph pair. Legibility faces (OpenDyslexic, Lexend and Atkinson Hyperlegible Next) carry an "L" stamp. Page and Read share one saved typeface. Headings, body text, lists, quotes and tables follow the same selection as the word stream, across all themes and restarts. Choosing a face updates the page immediately, and the case stays open for comparisons. Opening it pauses playback and keeps word position, WPM, grouping and bionic emphasis. The word display refits after both normal and bold faces load, including OpenDyslexic's wider letter shapes.

`assets/ui/typecase.css` owns the type case; `assets/reader-fonts.js` provides the catalog, glyph pairs and the font readiness signal. Code and the source view keep JetBrains Mono. Blackout hides the type slug with the rest of the instrument.

## Interface files

The interface is split by surface. Each file has one owner, and there are no override layers.

| File | Surface |
|---|---|
| `assets/ui/tokens.css` | Colour (every neutral derives from the accent), type, space, depth, layout and motion tokens |
| `assets/ui/base.css` | Element defaults, the focus ring and reduced motion |
| `assets/ui/primitives.css` | Keys, pips, rockers, slide switches, rulers, fields, rows, sheets, paper, the slot and the type slug |
| `assets/ui/shell.css` | Tray, rail, dock, spine and receipt |
| `assets/ui/desk.css`, `assets/ui/shelf.css` | Desk and Shelf |
| `assets/ui/prose.css`, `assets/ui/reader-page.css` | The reading surface; the strip, rails, find, Tools and focus mode |
| `assets/ui/search.css`, `assets/ui/dialogs.css` | The search sheet and the paste and licence panels |
| `assets/ui/prefs.css`, `assets/ui/typecase.css` | Preferences and the type case |
| `assets/graph-board.css`, `assets/graph-board.js` | The Map plate, rails, labels and paper tag |
| `assets/terminal*.css`, `assets/read-themes/*`, `assets/ui/read-shell.css` | The Read instruments and their dock and rail materials |

`assets/index.html` holds the shell markup and the glyph sprite. `assets/app.js` holds the views and actions, with one action line per surface. `docs/DESIGN.md` is the design specification.

## Bundled reading fonts

| Group | Bundled families |
|---|---|
| Sans | Source Sans 3, Inter, DM Sans, Work Sans, Nunito Sans |
| Accessibility | [OpenDyslexic](https://opendyslexic.org/), [Lexend](https://www.lexend.com/), [Atkinson Hyperlegible Next](https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext) |
| Serif | Literata, Lora, Newsreader, Alegreya, Crimson Pro, Fraunces |
| Mono | IBM Plex Mono, JetBrains Mono, Space Mono, Roboto Mono |

System sans and Book serif complete the twenty choices and retain existing preference values. The eighteen bundled families include 41 complete, unmodified font files: 37 TrueType and four OpenDyslexic WOFF2 faces. All include their SIL Open Font License notices. Families have separate italic faces except Lexend, whose upright variable face uses browser-synthesized slant. Missing characters use device fallback fonts. Interface text uses bundled Work Sans, IBM Plex Mono and Fraunces; reading headings retain theme colours, size and weight while following the shared typeface.

`assets/fonts.css` declares the fonts. `scripts/font-sources.json` pins every binary and license to an upstream Git blob hash, with repository commits for new families. Vendoring validates those hashes. `python scripts/fetch-fonts.py` fetches exactly those assets for maintenance; normal builds use local files. The native WebView serves TrueType as `font/ttf` and WOFF2 as `font/woff2`.

## Build on this phone

Read `~/android-dev/TOOLCHAIN.md` first. This project uses the existing no-Gradle Java toolchain and existing `~/dev/sdk/debug.keystore`. Do not replace that key if installed copies should update in place.

```sh
cd ~/dev/nightwire
npm ci --ignore-scripts
./build.sh
```

The build vendors libraries, compiles the classifier module with project-local TypeScript 6.0.3, compiles Java against API 35, dexes, aligns using the existing `~/dev/mkapk.py`, signs, and verifies the APK. Output: `nightwire.apk`. The newer native TypeScript compiler has no Android host build, so the compatible JavaScript compiler is pinned.

## Verification

```sh
npm test                    # extraction/graph and classifier contracts
node tests/browser.cjs      # end-to-end workflow: samples, search, Tools, Map, import, find, prefs, removal, palettes, native bridge
node tests/navigation.cjs   # overflow, scrolling, contents jumps and Map heading touch
node tests/themes.cjs       # reading themes, migration, Desk and Shelf actions, motion
node tests/fonts.cjs        # face loading/metrics, proof strip, rulers and persistence
node tests/font-rack.cjs    # type case drawers/search, live controls, all faces and instrument fitting
node tests/font-sync.cjs    # one typeface across Page/Read themes, headings and persistence
node tests/word-anchor.cjs  # fixed starts/baselines, long words, fonts, grouping and blackout
node tests/alignment.cjs    # Fixed/Centred geometry, settings/persistence and words-only blackout
node tests/graph-board.cjs  # Map: 11 layouts, layers/scope/tallies, file chooser, paper tag, fit and heading touch
node tests/terminal.cjs     # Read playback, touch speed, serial plate, dock spine and lifecycle
node tests/blackout.cjs     # pixel-verified words-only scenes, playback and exit/lifecycle checks
node tests/cyberdeck.cjs    # style switching, 66 single-screen layouts, control reachability and motion
node tests/index-themes.cjs # Index palettes, accents, materials, contrast and persistence
node tests/nav-dock.cjs     # dock, spine, tray cards, rail, receipt lanes and 44px targets
node tests/contrast.cjs     # AA contrast of every token for 11 accents × 3 intensities, with and without high contrast
node tests/theme-preview.cjs mixtape # inspect one instrument at 11 screen sizes
node tests/shots.cjs 8850 tests/shots after # every view at 412×915 and 830×714
./build.sh
./tests/native.sh           # actual Android ART import/storage checks
```

Browser tests reuse the existing Playwright install in `../folio/node_modules` and Folio's Mesa Chromium launch helper. They do not modify Folio. On a different machine, provide Playwright and adjust those two require paths. Browser verification starts its own local server on port 8789; navigation regressions use port 8790. Theme/desk regressions use port 8791. Font checks use port 8792. Classic terminal checks use port 8793. Cyberdeck checks use port 8794. Blackout checks use port 8795. The individual theme preview uses port 8796 (override with `THEME_PREVIEW_PORT`); Index palette checks use port 8797; switchboard checks use port 8798; Trace checks use port 8799; typeface-rack checks use port 8800; font-sync checks use port 8801; word-origin checks use port 8802; alignment checks use port 8803; contrast checks use port 8804. `tests/shots.cjs` takes its port as the first argument, and `VIEWS=home,library` limits the views. Each suite closes its server on completion.

Verified: Unicode and duplicate heading anchors; code-block extraction; wikilink resolution; tag and heading graph edges; classifier output validation/cancellation; browser file import; sanitization of hostile HTML; zero external resource requests; search; outline; source; bookmarking; Map rendering and node navigation; find; analysis JSON download; focus mode; preferences and persistence; two-step removal; layouts at 320/412/800/1280 px. Native checks run on ART without installing the candidate and cover source preservation, duplicate and changed files, BOM/UTF-16, malformed UTF-8/binary/size rejection, stream limits, and atomic catalog persistence.

Nightwire 0.9.3 adds a persistent Fixed/Centred word-alignment toggle in Reading preferences. Centred restores the earlier whole-frame layout. Both modes work in all six Read instruments and blackout, while retaining word position, font, WPM, grouping and emphasis. Read layouts also cap their height to the current viewport and share the switchboard height token during resizing.

Nightwire 0.9.2 fixes each word frame to a stable left edge and baseline. Two-word mode uses two reserved slots, and long-word fitting changes glyph size without moving their origins. The same layout works in all six instruments, bionic/plain text and blackout.

Nightwire 0.9.1 makes all six Page heading levels follow the shared Page/Read typeface, including Gruvbox. The rack and settings explain that shared choice. Checks cover changes in both readers across all six Page/Read themes, bionic/plain text, reload, accessibility faces and the preferences selector.

Nightwire 0.9.0 adds twenty typeface choices, a direct searchable specimen rack, and the Trace graph board. Accessibility choices include OpenDyslexic, Lexend and Atkinson. Checks verify 41 bundled faces, all fonts in the compact two-word display, shared controls across six instruments, graph counts/layers/scope, responsive plotting and direct heading touch.

Nightwire 0.8.0 replaces the bottom navigation with an expanding switchboard and separate file-loading tab. It adds an actual filename/count register, active-route accessibility and search-panel state. Checks cover 28 route/width combinations, all six material treatments, 66 single-screen Read layouts, blackout, normal document navigation and native imports.

Nightwire 0.7.1 reconnects Index to the six Reading page palettes and OLED/original backgrounds. Nightwire also inherits the interface accent and custom colour. Derived material tokens coordinate paper keys, controls, ruler, miniature and navigation, with contrast, intensity, persistence and unchanged reading state checks.

Nightwire 0.7.0 gives every Read instrument a complete design pass, with independent markup, responsive layouts, controls and miniature previews. All six navigation palettes follow the active instrument. Checks cover 66 screen layouts, 48 pixel-verified blackout scenes, playback/lifecycle, font persistence and native imports.

Nightwire 0.6.1 adds temporary words-only blackout to every Read style, including native immersive system bars and tap/Back/keyboard exits. Browser checks inspect every pixel outside the word bounds in 48 scenes across six styles, bionic/plain text and four screen sizes; they also exercise playback, native bridge pairing, cleanup and restart recovery.

Nightwire 0.6.0 adds Phosphor, Mixtape, Orbital and Nocturne, with distinct chrome, artwork, type, transport keys and layouts. Settings includes six silhouette previews. Browser checks cover all styles at 11 screen sizes, preview/selector synchronization, playback and reload persistence, plus unchanged classifier input.

Nightwire 0.5.1 makes both Read styles fit on one screen, with an integrated toolbar and compact controls. Browser checks cover 11 portrait/landscape viewport sizes for each style, no page overflow, all controls visible and reachable, readable word sizing, and retained playback settings.

Nightwire 0.5.0 preserves Classic as a persistent settings choice and adds the Cyberdeck presentation. Checks cover the default style, Classic preservation, live switching without lost position/settings, hardware controls, phone chassis bounds, backgrounding, reduced-motion cleanup, and unchanged classifier input.

Nightwire 0.4.1 brings the terminal into the reading desk’s visual style: shared typography and controls, an engraved speed slider, a folded reading surface, integrated progress and a current-section marker. The themed file chooser replaces the Android dropdown and pauses playback; browser checks cover file switching, phone control visibility and code-only empty states.

Nightwire 0.4.0 adds the offline terminal tab with bionic emphasis, one/two-word frames, an Anime.js speed ruler and per-file progress. Unit and browser checks cover word extraction, WPM timing, touch adjustment, pause/resume, backgrounding, hot-open, section return, long words, narrow layouts and reduced motion.

Nightwire 0.3.1 adds four bundled reading font families beside the existing system fonts. Typeface controls now sit beside reading themes, with a live specimen. Checks verify all ten font files, real bold/italic loading, glyph metrics, monospace widths, migration/persistence, independent theme/type settings, source separation, responsive controls and zero external font requests.

Nightwire 0.3.0 adds six complete reading styles with independent theme/OLED backgrounds and existing type settings. The home page is a reading desk with actual file/section actions. Tests cover rendered theme and syntax colours, text/link contrast, migration and persistence, classifier revision stability, desk/bookmark/section navigation, responsive settings, Anime.js cleanup, and OS/app reduced motion.

Nightwire 0.2.1 fixes long-title/filename overflow in the home and library grids, hides native and CSS scrollbar indicators while preserving scrolling, and makes graph heading dots and labels open their sections with one tap. Overlapping touch targets resolve to the nearest node. Anchor lookup stays inside the document and uses source-line metadata if sanitization removed an ID. Focused browser checks cover these behaviors, wide code/tables, and colliding/sanitized/duplicate anchors.

Nightwire 0.2.0 adds tactile controls and expanded appearance settings. Browser checks cover every preset, custom colour validation and contrast, palette/intensity persistence, pressed states, ripples, reduced motion, haptics bridge/toggle behavior, live graph recolouring, and settings layouts at 320/412/800/1280 px. Hardware haptics need a normal on-device check after installing.

The APK signature verifies with v2 and v3 signing. The Android file-manager chooser and system install/import/export dialogs still need a normal on-device tap-through after installation; browser and ART tests do not exercise those system windows.
