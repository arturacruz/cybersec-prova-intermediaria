"use strict";

(() => {
  if (window.__oceaniaPageDetectorInstalled) return;
  Object.defineProperty(window, "__oceaniaPageDetectorInstalled", { value: true });

  const channel = "OCEANIA_PAGE_PRIVACY_SIGNAL_V2";
  const observedApis = new Set();
  let notified = false;
  let textMeasurements = 0;

  function notify(api, strongSignal = true) {
    observedApis.add(api);
    if (!strongSignal || notified) return;
    notified = true;
    window.postMessage({
      channel,
      signal: "canvas",
      apis: [...observedApis]
    }, "*");
  }

  function wrap(prototype, method, label, strongSignal = true, afterCall = null) {
    if (!prototype || typeof prototype[method] !== "function") return;
    const original = prototype[method];
    Object.defineProperty(prototype, method, {
      configurable: true,
      writable: true,
      value: function (...args) {
        if (afterCall) afterCall();
        notify(label, strongSignal);
        return Reflect.apply(original, this, args);
      }
    });
  }

  wrap(globalThis.HTMLCanvasElement?.prototype, "toDataURL", "canvas.toDataURL");
  wrap(globalThis.HTMLCanvasElement?.prototype, "toBlob", "canvas.toBlob");
  wrap(globalThis.OffscreenCanvas?.prototype, "convertToBlob", "offscreenCanvas.convertToBlob");
  wrap(globalThis.CanvasRenderingContext2D?.prototype, "getImageData", "canvas2d.getImageData");
  wrap(globalThis.WebGLRenderingContext?.prototype, "readPixels", "webgl.readPixels");
  wrap(globalThis.WebGL2RenderingContext?.prototype, "readPixels", "webgl2.readPixels");

  wrap(
    globalThis.CanvasRenderingContext2D?.prototype,
    "measureText",
    "canvas2d.measureText",
    false,
    () => {
      textMeasurements += 1;
      if (textMeasurements === 5) notify("canvas2d.measureText", true);
    }
  );
})();
