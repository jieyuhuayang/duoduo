// duoduo reconstruction — subsystem: 05-drain-turn
// symbol: initQueueOutboundAttachmentModule  (minified: AS, daemon.pretty.js:73608)
// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)
// NOTE: readable extract from daemon.recon.js; references other top-level
// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).

var dEe, Dht, ip, fEe, wA, SA, initQueueOutboundAttachmentModule = O(() => {
    "use strict";
    vc();
    pt();
    $r();
    dEe = "application/octet-stream", Dht = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".bmp": "image/bmp",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".md": "text/markdown",
        ".json": "application/json",
        ".csv": "text/csv",
        ".zip": "application/zip",
        ".tar": "application/x-tar",
        ".gz": "application/gzip",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".opus": "audio/ogg",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
        ".avi": "video/x-msvideo"
    }, ip = "QueueOutboundAttachment", fEe = "mcp__aladuo__QueueOutboundAttachment", wA = `Queue a file to be sent to the user at the end of this turn.

You MUST call this before ending any turn where the user asked you to send a file, image, or document.
The file is delivered automatically when the turn ends — no further action needed after this call succeeds.
Only tell the user the file was sent after this tool returns success.

If the tool fails (unsupported MIME type or file too large), tell the user the channel limitation
and offer a fallback (e.g. paste content as text, or ask the user to switch to a channel that supports files).`, SA = {
        path: mt.string().describe("Absolute or relative path to the file to send. Relative paths are resolved from the current session's working directory (cwd). To find the current cwd, call ViewSessions with your own session_key first. The path must point to an existing regular file — directories are not supported."),
        mime: mt.string().describe("MIME type of the file. If omitted, inferred from the file extension (e.g. '.png' → 'image/png', '.pdf' → 'application/pdf'). Override only when the extension is ambiguous or missing.").optional(),
        session_key: mt.string().describe("Target session key. Defaults to the current running session when omitted. Call ViewSessions with no argument to get the current session_key — your own line is marked (you).").optional()
    }
});
