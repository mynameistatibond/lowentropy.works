/**
 * PostHog Analytics Initialization
 * ================================
 * Integrated with Low Entropy Works Consent System.
 *
 * Logic:
 * 1. Initialize PostHog with `opt_out_capturing_by_default: true`.
 * 2. Check global consent state `window.LE_CAN_RUN_ANALYTICS()`.
 * 3. If consented, call `posthog.opt_in_capturing()`.
 * 4. Listen for `le:consent_updated` events to toggle tracking dynamically.
 */

// 1. PostHog Snippet (Standard)
!function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);

// 2. Initialize with Default Opt-Out
posthog.init('phc_fJYWxeEi1JpxYjdI2zPW7YYgi07HDJyyaIF2yk7wlBq', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2025-11-30',
    opt_out_capturing_by_default: true, // Crucial: Do not track until explicit opt-in
    persistence: 'cookie' // Will only set cookies after opt-in
});

// 3. Consent Logic Integration
(function () {
    // Helper to apply current state
    function applyPostHogConsent(state) {
        if (state && state.analytics) {
            // Analytics allowed
            if (posthog.has_opted_out_capturing()) {
                posthog.opt_in_capturing();
                // capture pageview manually if it was missed? 
                // PostHog handles this gracefully usually, but for strictness we just opt-in.
            }
        } else {
            // Analytics denied
            if (posthog.has_opted_in_capturing()) {
                posthog.opt_out_capturing();
            }
        }
    }

    // A. Check immediately (if consent.js ran first)
    if (window.LE_CONSENT) {
        applyPostHogConsent(window.LE_CONSENT);
    }

    // B. Listen for updates (user clicked "Save" or "Accept All")
    window.addEventListener('le:consent_updated', (e) => {
        applyPostHogConsent(e.detail);
    });

})();
