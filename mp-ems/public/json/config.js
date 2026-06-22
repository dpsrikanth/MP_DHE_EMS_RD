/**
 * Runtime API configuration.
 *
 * Loaded as a plain <script> in index.html BEFORE the React bundle, so the
 * value below is resolved at runtime in the browser — not baked in at build
 * time. This lets the SAME build run on Dev / UAT / Prod with no code changes.
 *
 * Resolution order:
 *   1. API_BASE_URL_OVERRIDE  — set this only if the backend lives on a
 *      different host/port/path than the auto-detected one
 *      (e.g. "http://172.16.1.105:8080/api").
 *   2. Automatic detection from window.location + this script's own URL:
 *        - localhost / 127.0.0.1  -> http(s)://<host>:8080/api   (local dev)
 *        - any deployed host       -> http(s)://<host><prefix>/api
 *          where <prefix> is the sub-path the app is served under, detected
 *          from this script's URL. Served at root      -> "/api"
 *                                    served at /ems/    -> "/ems/api"
 */
(function () {
    // Leave empty for automatic detection. Set to an absolute URL to force it.
    var API_BASE_URL_OVERRIDE = "";

    // Detect the deployment sub-path from this script's own URL,
    // which is loaded as "<prefix>/json/config.js".
    function getBasePath() {
        var src = (document.currentScript && document.currentScript.src) || "";
        if (!src) {
            var scripts = document.getElementsByTagName("script");
            for (var i = 0; i < scripts.length; i++) {
                if ((scripts[i].src || "").indexOf("/json/config.js") !== -1) {
                    src = scripts[i].src;
                    break;
                }
            }
        }
        var marker = "/json/config.js";
        var idx = src.indexOf(marker);
        if (idx === -1) return "";
        var path = src.substring(0, idx);              // e.g. "http://host/ems"
        var origin = window.location.origin;
        if (path.indexOf(origin) === 0) {
            path = path.substring(origin.length);      // -> "/ems" (or "")
        }
        return path;
    }

    function resolveBaseUrl() {
        if (API_BASE_URL_OVERRIDE) {
            return API_BASE_URL_OVERRIDE;
        }

        var loc = window.location;
        var host = loc.hostname;

        // Local development: CRA dev server (3000) -> backend on 8080
        if (host === "localhost" || host === "127.0.0.1") {
            return loc.protocol + "//" + host + ":8080/api";
        }

        // Deployed (UAT / Prod): API on the same origin, under the same sub-path
        return loc.protocol + "//" + loc.host + getBasePath() + "/api";
    }

    window.EMS_CONFIG = {
        API_BASE_URL: resolveBaseUrl()
    };
})();
