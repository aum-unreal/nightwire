# Nightwire

An OLED Markdown reader for Android. Open a downloaded `.md` file directly, read it, search it, and explore its structure. No vault setup.

## Use it

Install `nightwire.apk` (Android 8+). In Downloads or another file manager, choose **Open with → Nightwire**. Alternatively, open Nightwire and tap **Open Markdown** or the plus button. The system picker can open several files at once. Sharing Markdown or plain text to Nightwire works too.

The app keeps private copies of opened documents. Bookmarks and reading positions survive restarts. Removing a reading copy leaves the original file alone. Reopening identical content with the same filename reuses the existing copy; changed content gets a separate copy.

- Full-text fuzzy and prefix search across all opened files; `#tag` search.
- In-document find with previous/next matches; `Ctrl/Cmd+F` on a keyboard.
- Outline with source line numbers, source view, code copying, and Markdown export.
- Graph of headings, tags, and links in one file or across all opened files. Tap a heading dot or label to open its section directly. Select another node, then open its document, reference, or tag search. Drag to pan; pinch to zoom.
- Obsidian-style `[[wikilinks]]`, aliases, heading anchors, callouts, frontmatter, task lists, tables, and highlighted code.
- Bookmarks, last reading position, focus mode, text size, line spacing, serif/sans typography, higher contrast, and reduced motion.
- Eight coordinated accent palettes: Signal lime, Glacier, Ultraviolet, Hot pink, Amber terminal, Ember, Mint circuit, and Quiet night. A custom hex colour and hue slider, plus Low-key/Balanced/Vivid intensity, update interface controls and the graph immediately.
- Buttons and cards respond with a press effect and brief touch ripple. Optional Android haptics use standard view feedback and respect device settings. Turn Touch feedback off in Reading preferences; Motion and the system reduced-motion setting control animations.
- Six reading styles: Nightwire, Minimal, Catppuccin Mocha, Tokyo Night, Nord, and Gruvbox. Choose one in **Reading preferences → Reading page**. Headings, emphasis, links, syntax colours, callouts and tables share its palette. **Pure black page** keeps the background OLED black; turn it off for the theme’s original background. Typeface and size remain separate.
- Twenty reading typefaces, including OpenDyslexic, Lexend and Atkinson. Tap **Aa** directly on Page or in any Read instrument to open the typeface rack. Search, filter Sans/Serif/Mono/Access, and compare individual specimens with a live regular/bold/italic sample. Reading preferences retains its selector. All bundled fonts work offline; theme, size and spacing remain separate.
- A reading desk shows the last-opened document once, its saved position, a clickable section index, other files, and searchable topics. Library sorting does not change the last-opened document.
- Paste text into a new reading copy.
- Analysis JSON export for use with a classifier outside the app.

A sample set of three documents is available from the empty home screen. Samples are added only when requested.

## Scope

Nightwire is a reader. It does not edit original files. It does not require a folder grant or filesystem scanning. A graph connection means a heading relationship, shared tag, or explicit link; it does not claim semantic similarity.

Remote and relative images appear as placeholders. Remote image links open in the browser on demand. Embedded PNG/JPEG/WebP/GIF data images render locally. HTML is sanitized; scripts, frames, embedded media, styles, and document-authored app actions are removed. Reading makes no external requests. No API keys or classifier connections are bundled.

Limits: 8 MB of normalized text per file, 32 MB across stored reading copies, 450 visible graph nodes, and 2,000 highlighted find matches. The graph says when it is showing only the first 450 nodes. Search covers the full stored file. UTF-8 and BOM-marked UTF-16 are supported. Relative Markdown links resolve against uniquely named opened files; ambiguous or unopened targets prompt opening the target file. There is no directory or image-companion import in this version. Math and Mermaid are shown as source text/code.

## Mobile switchboard

The bottom navigation is a compact switchboard. Five numbered route keys expand the active destination and show its label. A separate tall `.md` tab opens the system file picker. The document register shows the actual current filename and stored file count. Search opens the existing search panel; its key indicates when that panel is open. A formatted document belongs to Files.

Every key has at least a 44 × 44 px touch target, an accessible name, visible keyboard focus and existing press/haptic feedback. Route changes animate the active key unless motion is disabled. The switchboard follows the active Read instrument with paper keys, moulded hardware, CRT function keys, cassette enamel, flight-console cuts or folio rules. Its key order stays consistent. OLED blackout and document focus hide it; wider screens retain the sidebar. Safe-area padding keeps the controls above the system gesture area.

`assets/nav-dock.css` owns the mobile layout and instrument materials. `assets/index.html` supplies the controls; `assets/app.js` updates the route, document register and accessible selection/search state. The shared Read controller measures the whole dock height before fitting each instrument.

## Terminal reading

**Reading preferences → Read tab style** selects one of six reading instruments. Tap its miniature preview or use the selector. Each instrument has its own layout, typography, controls and artwork. Cyberdeck remains the default. Switching styles pauses playback and retains word position, speed, grouping and emphasis. The selected prose font remains shared.

| Style | Design |
|---|---|
| Classic | An archival index desk: filed source tab, staked reading card, theme-aware paper keys and engraved pace rule. |
| Cyberdeck | A moulded field handheld: recessed OLED aperture, source cartridge, yellow transport keys, grip rail and a low instrument shelf. |
| Phosphor | A command workstation: rectangular CRT buffer, shell filename prompt, indexed function keys and physical keyboard transport. |
| Mixtape | A cassette machine: cream Side A label, oxide tape path, progress-driven reels, enamel piano keys and knurled rate wheels. |
| Orbital | A spacecraft optical bench: asymmetric graduated progress arc, payload rail, clipped actuator keys and paired velocity/payload controls. |
| Nocturne | A bound midnight folio: linen spine, ribbon bookmark, vertical controls in the page margin and an engraved compositor row. |

Index follows **Reading preferences → Reading page**, including all six palettes and **Pure black page**. With Nightwire selected, its accent follows the eight interface palettes or a custom colour. Its paper keys, surfaces, metal ruler and miniature derive from that shared palette; colour intensity and higher contrast apply too. Typeface, position, WPM and grouping stay separate.

The Read navigation takes the active instrument’s palette. Leaving Read restores the saved interface accent. Artwork is local CSS/SVG. Reels, arcs, gauges and counters use actual reading progress or settings. Reduced motion disables entry and instrument movement.

Each module in `assets/read-themes/` owns its markup, stylesheet and settings miniature. `assets/read-theme-registry.js` registers the modules; `assets/read-styles.js` supplies the selector. The shared `assets/terminal-reader.js` controls playback and blackout. `assets/terminal.css` and `assets/terminal-screen.css` provide the base control and viewport rules; `assets/terminal-anchor.css` fixes word slots and baselines across instruments and blackout; each instrument supplies its own compact and landscape layouts. `assets/read-styles.css` styles the gallery and bridges the active palette to navigation. All fonts and animation code are bundled.

Open the **Read** tab, or choose **Terminal reading** in a document’s tools menu. Choose one or two words per frame and set 80–1000 words per minute with the touch ruler, ±10 buttons or presets. Each frame begins at a fixed left edge and baseline. Two-word mode reserves two fixed slots, so either word can change length without moving the next frame's start. Long words shrink within their slots while the baseline stays fixed. Bionic emphasis highlights the first half of each word; it can be turned off. All six instruments use the selected reading font.

Tap the **moon button** in any Read style, or choose **Blackout reading** in its preferences, to show only the current words on pure black. This keeps the selected font, word colours, fixed word origins, bionic/plain emphasis, grouping, position and WPM. Entering blackout preserves whether reading is playing or paused. Android status/navigation bars hide while it is active. Tap anywhere, press Enter/Escape, or use Android Back to pause and restore the controls. Space can pause/resume on a keyboard. Backgrounding, changing files/tabs and opening search/preferences also leave blackout and pause. Blackout is a temporary session mode and does not reopen after a restart. Code-only files keep the moon button disabled.

Start/pause, step, restart, seek and switch files. Tap the filename to open Nightwire’s file chooser; playback pauses while the sheet is open. **Page** returns to the current section. Each file retains its own word position; speed, grouping and emphasis persist across launches. Playback pauses when opening search/preferences, changing tabs, opening another file or backgrounding the app. Resuming requires Start. Space toggles playback and arrow keys step when a control is not focused.

Frames use actual word counts: at 300 WPM, one word lasts 200 ms and two words last 400 ms. A late timer advances one frame without catching up. Headings, paragraphs, tables and link labels are read in source order; frontmatter, fenced code, raw HTML blocks and image references are skipped. Original Markdown and classifier input are unchanged.

## Architecture

The small native Java activity handles Android VIEW/SEND intents, the system file picker, private file storage, atomic metadata writes, clipboard, safe external-link opening, and export. File reads run on one background executor. The offline WebView interface runs at a virtual HTTPS origin intercepted by the activity. The activity serves only bundled assets and content-addressed document copies; other resource requests are blocked.

The interface uses plain HTML/CSS/JavaScript. `assets/core.js` extracts headings, links, tags, frontmatter, line numbers, and graph structure using Markdown-it tokens. `assets/search-worker.js` builds the MiniSearch index outside the main UI thread. Reading state is stored in WebView local storage; Markdown remains in private native files. IndexedDB provides the equivalent import/storage workflow when previewed in a desktop browser.

Planning focused on three decisions before expanding the interface: use direct Android content URIs instead of a vault; reuse mature render/search/graph libraries; and keep classifier input and output versioned and separate from reading state. The first version completes that reading workflow before adding a remote model service.

## Future classification

`classifier/index.ts` defines a strict, versioned `Classifier` interface and `ClassifierRegistry`. The app exposes `window.Nightwire.classifierInput(documentId?)` and `window.Nightwire.classifiers` for a future adapter. Inputs contain original Markdown, heading line numbers, tags, document identity, and the SHA-256 hash of normalized UTF-8 content. Output validation rejects unrecognized labels, invalid confidence values, a different task/document, and stale revisions. Provider, model, confidence, and optional source evidence remain explicit.

**More document tools → Export analysis JSON** produces the same input as a portable `.analysis.json` file. It can be fed to a TypeSafe Jev integration or another classifier later. Jev is not connected in this version. The interface is an internal contract, not an imitation of TypeSafe's HTTP API. A production remote adapter should translate to the provider's current SDK in a trusted native service or local backend; the offline renderer deliberately permits only its own origin. Keep credentials out of Markdown and WebView storage.

Consult [TypeSafe's official documentation](https://docs.typesafe.ai/) when adding that adapter. `tests/classifier.test.cjs` exercises the registry and validation, including cancellation.

## Reused open source

Dependencies are pinned in `package-lock.json`; distribution files are bundled for offline use. Full notices for the libraries and graph dependencies are in `assets/THIRD_PARTY_LICENSES.txt`, accessible in Reading preferences.

| Library | Role |
|---|---|
| [Markdown-it](https://github.com/markdown-it/markdown-it) | CommonMark/GFM parsing and rendering |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization |
| [MiniSearch](https://github.com/lucaong/minisearch) | Full-text fuzzy and prefix search |
| [force-graph](https://github.com/vasturiano/force-graph) | Canvas graph layout, pan, zoom, hit testing |
| [highlight.js](https://github.com/highlightjs/highlight.js) | Code syntax highlighting |
| [Lucide](https://github.com/lucide-icons/lucide) | UI icons |
| [Anime.js](https://animejs.com/documentation/animation/) | Short staggered desk transitions with cleanup and reduced-motion support |

`bezier-js` omits its license from its npm package; `scripts/licenses/bezier-js.txt` preserves the upstream MIT notice. The vendoring script also collects the bundled graph dependency licenses.

## Reading theme references

The reading presets adapt colour palettes and reading treatments from these projects to Nightwire’s Markdown DOM. They are inspired styles rather than installable Obsidian theme files. The bundled credits retain upstream notices; `scripts/theme-sources.json` pins their GitHub source blobs.

- [Minimal by kepano](https://github.com/kepano/obsidian-minimal): neutral type and restrained heading/quote borders. [Support the author](https://www.buymeacoffee.com/kepano).
- [Catppuccin for Obsidian](https://github.com/catppuccin/obsidian) and [Catppuccin palette](https://github.com/catppuccin/palette): Mocha colours with lavender, blue, green and peach heading levels.
- [Tokyo Night for Obsidian](https://github.com/tcmmichaelb139/obsidian-tokyonight): blue/violet headings and code on an ink background.
- [Nord](https://github.com/nordtheme/nord): frost links and slate surfaces.
- [Gruvbox](https://github.com/morhetz/gruvbox): amber/olive emphasis and warm text.

`assets/reader-themes.js` holds the adapted tokens; `assets/reader.css` scopes them to the reading surface. `assets/desk.css` styles the home view. `scripts/vendor.cjs` bundles Anime.js 4.5.0 and all credits locally. Short entry animations run once when entering the desk, revert their inline styles when finished, and stop when either app or OS motion is disabled.

## Typeface rack

The **Aa** control shows the current typeface on the formatted Page and all six Read instruments. Its rack contains twenty preview cards, a search field, family filters and an **Access** filter for OpenDyslexic, Lexend and Atkinson Hyperlegible Next. Page and Read share one saved typeface. Page headings, body text, lists, quotes and tables follow the same selection as the word stream, across all themes and restarts. Choosing a card updates the reading surface immediately; the rack remains open for comparisons. Opening it pauses playback and preserves word position, WPM, grouping and bionic emphasis. The word display refits after both normal and bold faces load, including OpenDyslexic's wider letter shapes.

`assets/font-rack.css` owns the rack and direct controls; `assets/reader-fonts.js` provides the catalog, specimens and font readiness signal. Source and code retain their dedicated monospace type. Blackout hides the typeface control with the rest of the instrument.

## Trace graph board

The graph sits in a plotting board with a source cartridge, scope rocker, three tactile layer keys, actual node/link counts, graduated edge markings and a docked node inspector. Desktop puts the instruments beside the plot; phone layouts keep them within one screen. Layer keys and their legend show actual visible node tallies. Zoom and Fit operate on the graph; resizing refits only after node coordinates exist. Heading dots and labels still jump directly to their sections.

`assets/graph-board.js` builds and updates the board; `assets/graph-board.css` owns its responsive materials. The existing force-graph renderer and navigation handlers remain shared.

## Bundled reading fonts

| Group | Bundled families |
|---|---|
| Sans | Source Sans 3, Inter, DM Sans, Work Sans, Nunito Sans |
| Accessibility | [OpenDyslexic](https://opendyslexic.org/), [Lexend](https://www.lexend.com/), [Atkinson Hyperlegible Next](https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext) |
| Serif | Literata, Lora, Newsreader, Alegreya, Crimson Pro, Fraunces |
| Mono | IBM Plex Mono, JetBrains Mono, Space Mono, Roboto Mono |

System sans and Book serif complete the twenty choices and retain existing preference values. The eighteen bundled families include 41 complete, unmodified font files: 37 TrueType and four OpenDyslexic WOFF2 faces. All include their SIL Open Font License notices. Families have separate italic faces except Lexend, whose upright variable face uses browser-synthesized slant. Missing characters use device fallback fonts. Style titles and settings previews also use bundled Literata and Plex; reading headings retain theme colours, size and weight while following the shared typeface.

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
npm test                 # extraction/graph and classifier contracts
node tests/browser.cjs   # real Chromium UI workflow and screenshots
node tests/navigation.cjs # overflow, scrolling, and heading touch regressions
node tests/themes.cjs    # reader styles, migration, desk actions and motion
node tests/fonts.cjs     # actual face loading/metrics, preview and persistence
node tests/font-rack.cjs # categories/search, live controls, all fonts and instrument fitting
node tests/font-sync.cjs # both directions across Page/Read themes, headings and persistence
node tests/word-anchor.cjs # fixed starts/baselines, long words, fonts, grouping and blackout
node tests/graph-board.cjs # 11 layouts, graph layers/scope/counts, fit and heading touch
node tests/terminal.cjs  # Classic word playback, touch speed, progress and lifecycle
node tests/blackout.cjs  # pixel-verified words-only scenes, playback and exit/lifecycle checks
node tests/cyberdeck.cjs # switching/state, 66 single-screen layouts, control reachability and motion
node tests/theme-preview.cjs mixtape # inspect one instrument at 11 screen sizes
node tests/index-themes.cjs # Index palettes, accents, materials, contrast and persistence
node tests/nav-dock.cjs  # route keys, 44px targets, file register, search/import and theme materials
./build.sh
./tests/native.sh        # actual Android ART import/storage checks
```

Browser tests reuse the existing Playwright install in `../folio/node_modules` and Folio's Mesa Chromium launch helper. They do not modify Folio. On a different machine, provide Playwright and adjust those two require paths. Browser verification starts its own local server on port 8789; navigation regressions use port 8790. Theme/desk regressions use port 8791. Font checks use port 8792. Classic terminal checks use port 8793. Cyberdeck checks use port 8794. Blackout checks use port 8795. The individual theme preview uses port 8796 (override with `THEME_PREVIEW_PORT`); Index palette checks use port 8797; switchboard checks use port 8798; Trace checks use port 8799; typeface-rack checks use port 8800; font-sync checks use port 8801; word-origin checks use port 8802. Each suite closes its server on completion.

Verified: Unicode and duplicate heading anchors; code-block extraction; wikilink resolution; tag and heading graph edges; classifier output validation/cancellation; browser file import; sanitization of hostile HTML; zero external resource requests; search; outline; source; bookmarking; graph rendering and node navigation; find; analysis JSON download; focus mode; preferences and persistence; removal; layouts at 320/412/800/1280 px. Native checks run on ART without installing the candidate and cover source preservation, duplicate and changed files, BOM/UTF-16, malformed UTF-8/binary/size rejection, stream limits, and atomic catalog persistence.

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
