/* demo-ui.js — presentation glue over the (untouched) recognition engine in
   pipeline.js. The engine still owns camera, detection, landmarks, recognizer
   and writes to the hidden #verdict / #targetProb / #status / #target elements;
   this file mirrors that into the polished card + manages the demo flow. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  function currentWord() {
    const t = $("target");
    return (t && t.value) ? t.value : "";
  }

  function syncWord() {
    const w = currentWord();
    if (!w) return;
    $("wordDisplay").textContent = w;
    $("signWord").textContent = w;
    const ref = $("refClip");
    if (ref && ref.dataset.word !== w) {
      ref.dataset.word = w;
      ref.src = "clips/" + w + ".mp4";
      ref.load();
      ref.play().catch(() => {});
    }
  }

  function hideResult() {
    const c = $("resultCard");
    c.className = "";
  }

  function setResult(state, badge, line, sub) {
    const c = $("resultCard");
    c.className = "show " + state;
    $("badge").textContent = badge;
    $("verdictLine").textContent = line;
    $("resultSub").textContent = sub;
  }

  function renderFromEngine() {
    const v = $("verdict");
    const cls = v.className || "";
    const txt = (v.textContent || "").trim();
    const w = currentWord();
    if (txt === "Capturing") {
      setResult("busy", "•••", "Reading your sign…", "Hold the sign steady for a moment.");
    } else if (cls.indexOf("accept") !== -1) {
      setResult("accept", "✓", "Nailed it!", `That read clearly as “${w}”.`);
    } else if (cls.indexOf("reject") !== -1 && txt === "Error") {
      setResult("reject", "!", "Something glitched", "Try again — make sure your hands are in frame.");
    } else if (cls.indexOf("reject") !== -1) {
      setResult("reject", "↻", "Not quite", `That didn’t read as “${w}” — give it another try.`);
    }
  }

  function reactToStatus() {
    const s = ($("status").textContent || "");
    const ready = $("readyDot");
    if (/camera ready|live/i.test(s)) {
      $("camDot").className = "dot on";
      $("camLabel").textContent = "Live";
      $("camEmpty").style.display = "none";
      ready.className = "dot on";
    } else if (/loading models/i.test(s)) {
      ready.className = "dot warn";
    } else if (/models ready/i.test(s)) {
      ready.className = "dot on";
    } else if (/denied|error|not supported|unsupported/i.test(s)) {
      $("camDot").className = "dot warn";
      $("camLabel").textContent = "Camera blocked";
      $("camEmpty").style.display = "grid";
      $("camEmpty").querySelector(".cta").textContent = "Camera needs permission";
    }
  }

  function start() {
    // wait until the engine has populated the target dropdown, then wire up.
    if (!currentWord()) { setTimeout(start, 120); return; }
    syncWord();

    // auto-load models in the background (the engine sets status as it goes).
    $("models").click();

    // tap the camera frame to grant permission / start the stream.
    $("camEmpty").addEventListener("click", () => $("camera").click());

    // "New word": pipeline.js already picks a new target on this click; sync after.
    $("random").addEventListener("click", () => { hideResult(); setTimeout(syncWord, 0); });

    // clear the result the moment a new capture begins
    $("capture").addEventListener("click", hideResult);

    // mirror the engine's verdict + status into the polished UI
    new MutationObserver(renderFromEngine).observe($("verdict"),
      { attributes: true, attributeFilter: ["class"], childList: true, characterData: true, subtree: true });
    new MutationObserver(reactToStatus).observe($("status"),
      { childList: true, characterData: true, subtree: true });
    reactToStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
