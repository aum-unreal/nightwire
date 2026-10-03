package dev.nightwire;

import android.app.Activity;
import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.*;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import org.json.*;

public class MainActivity extends Activity {
    private WebView web;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final ArrayList<Intent> pending = new ArrayList<>();
    private boolean ready = false, dead = false;
    private String exportId;
    private byte[] exportBytes;
    private static final int PICK = 10, EXPORT = 11, MAX_FILE = 8 * 1024 * 1024, MAX_LIBRARY = 32 * 1024 * 1024;
    private static final String ORIGIN = "https://nightwire.local/";
    private File docsDir;
    private JSONArray catalog = new JSONArray();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xff000000);
        getWindow().setNavigationBarColor(0xff000000);
        // Android 15 edge-to-edge: keep controls out of the system bars and keyboard.
        android.widget.FrameLayout root = new android.widget.FrameLayout(this);
        root.setBackgroundColor(0xff000000);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        web = new WebView(this);
        web.setBackgroundColor(0xff000000);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        root.addView(web, new android.widget.FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        docsDir = new File(getFilesDir(), "documents"); docsDir.mkdirs();
        io.execute(() -> { try { File f = new File(getFilesDir(), "catalog.json"); if (f.exists()) catalog = new JSONArray(new String(readLimited(new FileInputStream(f), 1024 * 1024), StandardCharsets.UTF_8)); } catch (Exception e) { emitError("Could not read recent files. Your Markdown copies are still stored on this device."); } });
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false); s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportZoom(false); s.setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new Bridge(), "Native");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView w, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("https".equals(u.getScheme()) && "nightwire.local".equals(u.getHost())) {
                    String path = u.getPath();
                    try {
                        InputStream stream; String mime;
                        if (path.matches("/docs/[a-f0-9]{64}\\.md")) { stream = new FileInputStream(new File(docsDir, path.substring(6))); mime = "text/plain"; }
                        else { String asset = path.equals("/") ? "index.html" : path.substring(1); if (asset.contains("..")) throw new IOException(); stream = getAssets().open(asset); mime = asset.endsWith(".js") ? "application/javascript" : asset.endsWith(".css") ? "text/css" : asset.endsWith(".html") ? "text/html" : asset.endsWith(".json") ? "application/json" : asset.endsWith(".svg") ? "image/svg+xml" : asset.endsWith(".ttf") ? "font/ttf" : asset.endsWith(".woff2") ? "font/woff2" : "text/plain"; }
                        Map<String,String> headers = new HashMap<>(); headers.put("Access-Control-Allow-Origin", ORIGIN.substring(0, ORIGIN.length()-1)); headers.put("Cache-Control", "no-store"); headers.put("X-Content-Type-Options", "nosniff");
                        return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, stream);
                    } catch (Exception e) { return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0])); }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Offline", null, new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest req) { return !req.getUrl().toString().startsWith(ORIGIN); }
            @Override public void onPageFinished(WebView w, String url) {
                if (!url.equals(ORIGIN + "index.html")) return;
                ready = true;
                synchronized (pending) { for (Intent i : pending) handleIntent(i); pending.clear(); }
            }
        });
        pending.add(getIntent());
        web.loadUrl(ORIGIN + "index.html");
    }
    private void event(String type, Object value) {
        final String json = JSONObject.quote(type) + ", {detail:" + String.valueOf(value) + "}";
        runOnUiThread(() -> { if (!dead) web.evaluateJavascript("window.dispatchEvent(new CustomEvent(" + json + "))", null); });
    }
    private void emitError(String message) { event("native-error", JSONObject.quote(message)); }
    private void list(String active) {
        try { JSONObject result = new JSONObject(); result.put("docs", catalog); result.put("active", active == null ? JSONObject.NULL : active); event("native-library", result); } catch (Exception e) { emitError("Unable to list documents."); }
    }
    private void saveCatalog() throws Exception {
        android.util.AtomicFile af = new android.util.AtomicFile(new File(getFilesDir(), "catalog.json"));
        FileOutputStream out = af.startWrite();
        try { out.write(catalog.toString().getBytes(StandardCharsets.UTF_8)); af.finishWrite(out); } catch (Exception e) { af.failWrite(out); throw e; }
    }
    private byte[] readLimited(InputStream in, int max) throws IOException {
        try (InputStream stream = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) { byte[] b = new byte[16384]; int n; while ((n = stream.read(b)) != -1) { if (out.size() + n > max) throw new IOException("File is too large (8 MB maximum per file)."); out.write(b, 0, n); } return out.toByteArray(); }
    }
    private String importText(String name, byte[] bytes) throws Exception {
        String text;
        if (bytes.length >= 2 && ((bytes[0] & 255) == 255 && (bytes[1] & 255) == 254 || (bytes[0] & 255) == 254 && (bytes[1] & 255) == 255)) text = new String(bytes, StandardCharsets.UTF_16);
        else text = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(bytes)).toString();
        if (text.indexOf('\0') >= 0) throw new IOException("This looks like a binary file. Choose a Markdown or text file.");
        if (text.startsWith("\ufeff")) text = text.substring(1);
        byte[] normalized = text.getBytes(StandardCharsets.UTF_8);
        if (normalized.length > MAX_FILE) throw new IOException("File is too large (8 MB maximum).");
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(name.getBytes(StandardCharsets.UTF_8)); md.update((byte)0); md.update(normalized);
        StringBuilder hex = new StringBuilder(); for (byte b : md.digest()) hex.append(String.format(Locale.ROOT, "%02x", b));
        String id = hex.toString();
        for (int i = 0; i < catalog.length(); i++) if (catalog.getJSONObject(i).getString("id").equals(id)) return id;
        long total = normalized.length; for (int i = 0; i < catalog.length(); i++) total += catalog.getJSONObject(i).optLong("bytes");
        if (total > MAX_LIBRARY) throw new IOException("Recent files reached 32 MB. Remove a stored copy to make room.");
        File copy = new File(docsDir, id + ".md");
        try (FileOutputStream out = new FileOutputStream(copy)) { out.write(normalized); }
        JSONObject doc = new JSONObject().put("id", id).put("name", name).put("bytes", normalized.length).put("imported", System.currentTimeMillis()).put("url", ORIGIN + "docs/" + id + ".md");
        catalog.put(doc);
        try { saveCatalog(); } catch (Exception e) { catalog.remove(catalog.length()-1); copy.delete(); throw e; }
        return id;
    }
    private String importUri(Uri uri) throws Exception {
        String name = "Document.md";
        try (Cursor c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) { if (c != null && c.moveToFirst()) name = c.getString(0); } catch (Exception ignored) { if (uri.getLastPathSegment() != null) name = uri.getLastPathSegment(); }
        if (name == null) name = "Document.md";
        InputStream in = getContentResolver().openInputStream(uri);
        if (in == null) throw new IOException("Could not open the selected file.");
        return importText(name, readLimited(in, MAX_FILE));
    }
    private void importUris(ArrayList<Uri> uris) {
        event("native-busy", "true");
        io.execute(() -> { String active = null; for (Uri u : uris) { try { active = importUri(u); } catch (Exception e) { emitError(e instanceof CharacterCodingException ? "This file is not UTF-8 or UTF-16 text." : (e.getMessage() == null ? "Unable to open file." : e.getMessage())); } } list(active); event("native-busy", "false"); });
    }
    @Override protected void onNewIntent(Intent i) { super.onNewIntent(i); setIntent(i); if (ready) handleIntent(i); else synchronized(pending) { pending.add(i); } }
    private void handleIntent(Intent i) {
        String action = i.getAction(); ArrayList<Uri> uris = new ArrayList<>();
        if (Intent.ACTION_VIEW.equals(action) && i.getData() != null) uris.add(i.getData());
        if (Intent.ACTION_SEND.equals(action)) {
            Uri u = i.getParcelableExtra(Intent.EXTRA_STREAM); if (u != null) uris.add(u);
            else if (i.getCharSequenceExtra(Intent.EXTRA_TEXT) != null) { String text = i.getCharSequenceExtra(Intent.EXTRA_TEXT).toString(); io.execute(() -> { try { list(importText("Shared note.md", text.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { emitError("Could not import shared text."); } }); }
        }
        if (Intent.ACTION_SEND_MULTIPLE.equals(action)) { ArrayList<Uri> streams = i.getParcelableArrayListExtra(Intent.EXTRA_STREAM); if (streams != null) uris.addAll(streams); }
        if (!uris.isEmpty()) importUris(uris);
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data); if (result != RESULT_OK || data == null) return;
        if (request == PICK) { ArrayList<Uri> uris = new ArrayList<>(); if (data.getClipData() != null) { for (int n = 0; n < data.getClipData().getItemCount(); n++) uris.add(data.getClipData().getItemAt(n).getUri()); } else if (data.getData() != null) uris.add(data.getData()); importUris(uris); }
        if (request == EXPORT && data.getData() != null && (exportId != null || exportBytes != null)) { final String id = exportId; final byte[] bytes = exportBytes; final Uri u = data.getData(); exportId = null; exportBytes = null; io.execute(() -> { try (InputStream in = bytes != null ? new ByteArrayInputStream(bytes) : new FileInputStream(new File(docsDir, id + ".md")); OutputStream out = getContentResolver().openOutputStream(u, "wt")) { if (out == null) throw new IOException(); byte[] buf = new byte[16384]; int n; while ((n = in.read(buf)) != -1) out.write(buf, 0, n); event("native-message", JSONObject.quote(bytes != null ? "Analysis data exported" : "Markdown copy exported")); } catch (Exception e) { emitError("Export failed. Try another destination."); } }); }
    }
    private void readingBlackout(boolean enabled) {
        if (dead) return;
        android.view.View decor = getWindow().getDecorView();
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            android.view.WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.setSystemBarsBehavior(android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                if (enabled) controller.hide(android.view.WindowInsets.Type.systemBars());
                else controller.show(android.view.WindowInsets.Type.systemBars());
            }
        } else {
            decor.setSystemUiVisibility(enabled ? android.view.View.SYSTEM_UI_FLAG_FULLSCREEN | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY : android.view.View.SYSTEM_UI_FLAG_VISIBLE);
        }
        decor.requestApplyInsets();
    }
    public class Bridge {
        @JavascriptInterface public void readingBlackout(boolean enabled) { runOnUiThread(() -> MainActivity.this.readingBlackout(enabled)); }
        @JavascriptInterface public void haptic(boolean confirm) { runOnUiThread(() -> { if (!dead && web != null && web.isShown()) web.performHapticFeedback(confirm ? android.view.HapticFeedbackConstants.CONTEXT_CLICK : android.view.HapticFeedbackConstants.KEYBOARD_TAP); }); }
        @JavascriptInterface public void list() { io.execute(() -> MainActivity.this.list(null)); }
        @JavascriptInterface public void openFiles() { runOnUiThread(() -> { Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true); try { startActivityForResult(i, PICK); } catch (Exception e) { emitError("No file picker available."); } }); }
        @JavascriptInterface public void addText(String name, String text) { io.execute(() -> { try { MainActivity.this.list(importText(name, text.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { emitError(e.getMessage()); } }); }
        @JavascriptInterface public void remove(String id) { if (!id.matches("[a-f0-9]{64}")) return; io.execute(() -> { try { JSONArray before = catalog; JSONArray next = new JSONArray(); for(int n=0;n<catalog.length();n++) if(!catalog.getJSONObject(n).getString("id").equals(id)) next.put(catalog.getJSONObject(n)); catalog = next; try { saveCatalog(); } catch(Exception e) { catalog = before; throw e; } new File(docsDir,id+".md").delete(); MainActivity.this.list(null); } catch(Exception e) { emitError("Could not remove the stored copy."); } }); }
        @JavascriptInterface public void export(String id, String name) { if (!id.matches("[a-f0-9]{64}")) return; runOnUiThread(() -> { exportId = id; exportBytes = null; try { startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("text/markdown").putExtra(Intent.EXTRA_TITLE, name), EXPORT); } catch(Exception e) { emitError("No export picker available."); } }); }
        @JavascriptInterface public void exportStructured(String name, String json) { if (json.length() > MAX_FILE * 2) { emitError("Analysis data is too large to export."); return; } runOnUiThread(() -> { exportId = null; exportBytes = json.getBytes(StandardCharsets.UTF_8); try { startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE, name), EXPORT); } catch(Exception e) { emitError("No export picker available."); } }); }
        @JavascriptInterface public void copy(String text) { runOnUiThread(() -> ((android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Nightwire", text))); }
        @JavascriptInterface public void external(String url) { runOnUiThread(() -> { Uri u = Uri.parse(url); if (!"https".equals(u.getScheme()) && !"http".equals(u.getScheme()) && !"mailto".equals(u.getScheme())) return; try { startActivity(new Intent(Intent.ACTION_VIEW,u)); } catch(Exception e) { emitError("No app available to open this link."); } }); }
    }
    @Override public void onBackPressed() { web.evaluateJavascript("window.Nightwire && window.Nightwire.back()", r -> { if (!"true".equals(r)) super.onBackPressed(); }); }
    @Override protected void onPause() { super.onPause(); readingBlackout(false); web.evaluateJavascript("window.Nightwire && (window.Nightwire.pauseReading(), window.Nightwire.savePosition())", null); web.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() { dead = true; io.shutdown(); web.removeJavascriptInterface("Native"); web.destroy(); super.onDestroy(); }
}
