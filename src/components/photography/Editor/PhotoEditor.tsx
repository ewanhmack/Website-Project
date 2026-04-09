import React, { useEffect, useRef, useState } from "react";
import { getPhotoUrlForCanvas } from "../../../utils/photos";

const PREVIEW_MAX_PX = 1200;

const PRESETS = {
  none:  { brightness: 0, contrast: 0, exposure: 0, highlights: 0, shadows: 0, saturation: 0, temperature: 0, tint: 0, hue: 0, grain: 0, vignette: 0 },
  film:  { brightness: 5, contrast: 15, exposure: 0, highlights: -20, shadows: 15, saturation: -15, temperature: 10, tint: 5, hue: 0, grain: 40, vignette: 30 },
  fade:  { brightness: 20, contrast: -20, exposure: 5, highlights: -10, shadows: 20, saturation: -30, temperature: 5, tint: 0, hue: 0, grain: 10, vignette: 10 },
  bw:    { brightness: 0, contrast: 20, exposure: 0, highlights: -10, shadows: 10, saturation: -100, temperature: 0, tint: 0, hue: 0, grain: 20, vignette: 20 },
  cross: { brightness: 0, contrast: 30, exposure: 10, highlights: 20, shadows: -20, saturation: 40, temperature: 30, tint: -20, hue: 15, grain: 15, vignette: 25 },
  vivid: { brightness: 5, contrast: 25, exposure: 5, highlights: 10, shadows: 5, saturation: 60, temperature: 5, tint: 0, hue: 0, grain: 0, vignette: 0 },
};

const SLIDER_CONFIG = [
  {
    group: "Light",
    sliders: [
      { id: "brightness", label: "Brightness", min: -100, max: 100 },
      { id: "contrast",   label: "Contrast",   min: -100, max: 100 },
      { id: "exposure",   label: "Exposure",   min: -100, max: 100 },
      { id: "highlights", label: "Highlights", min: -100, max: 100 },
      { id: "shadows",    label: "Shadows",    min: -100, max: 100 },
    ],
  },
  {
    group: "Colour",
    sliders: [
      { id: "saturation",  label: "Saturation",  min: -100, max: 100 },
      { id: "temperature", label: "Temperature", min: -100, max: 100 },
      { id: "tint",        label: "Tint",        min: -100, max: 100 },
      { id: "hue",         label: "Hue",         min: -180, max: 180 },
    ],
  },
  {
    group: "Detail",
    sliders: [
      { id: "grain",    label: "Grain",    min: 0, max: 100 },
      { id: "vignette", label: "Vignette", min: 0, max: 100 },
    ],
  },
];

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    return [l, l, l];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

function applyEditsToCanvas(canvas, origImageData, adjustments) {
  const { brightness, contrast, exposure, highlights, shadows, saturation, temperature, tint, hue, grain, vignette } = adjustments;
  const w = canvas.width;
  const h = canvas.height;
  const src = new Uint8ClampedArray(origImageData.data);
  const out = new Uint8ClampedArray(src.length);

  const brightN = brightness / 100;
  const contN   = contrast / 100;
  const expoN   = exposure / 100;
  const highN   = highlights / 100;
  const shadN   = shadows / 100;
  const satN    = saturation / 100;
  const tempN   = temperature / 100;
  const tintN   = tint / 100;
  const grainN  = grain / 100;

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i] / 255;
    let g = src[i + 1] / 255;
    let b = src[i + 2] / 255;

    r = Math.min(1, Math.max(0, r + brightN));
    g = Math.min(1, Math.max(0, g + brightN));
    b = Math.min(1, Math.max(0, b + brightN));

    r = Math.min(1, Math.max(0, (r - 0.5) * (1 + contN) + 0.5));
    g = Math.min(1, Math.max(0, (g - 0.5) * (1 + contN) + 0.5));
    b = Math.min(1, Math.max(0, (b - 0.5) * (1 + contN) + 0.5));

    const ef = Math.pow(2, expoN);
    r = Math.min(1, r * ef);
    g = Math.min(1, g * ef);
    b = Math.min(1, b * ef);

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (highN !== 0 && lum > 0.5) {
      const f = (lum - 0.5) * 2;
      r = Math.min(1, r + highN * f * 0.3);
      g = Math.min(1, g + highN * f * 0.3);
      b = Math.min(1, b + highN * f * 0.3);
    }

    if (shadN !== 0 && lum < 0.5) {
      const f = (0.5 - lum) * 2;
      r = Math.min(1, Math.max(0, r + shadN * f * 0.3));
      g = Math.min(1, Math.max(0, g + shadN * f * 0.3));
      b = Math.min(1, Math.max(0, b + shadN * f * 0.3));
    }

    r = Math.min(1, Math.max(0, r + tempN * 0.2));
    b = Math.min(1, Math.max(0, b - tempN * 0.2));
    g = Math.min(1, Math.max(0, g + tintN * 0.15));

    let [h2, s2, l2] = rgbToHsl(r, g, b);
    h2 = (h2 + hue / 360 + 1) % 1;
    s2 = Math.min(1, Math.max(0, s2 + satN * s2));
    [r, g, b] = hslToRgb(h2, s2, l2);

    if (grainN > 0) {
      const noise = (Math.random() - 0.5) * grainN * 0.25;
      r = Math.min(1, Math.max(0, r + noise));
      g = Math.min(1, Math.max(0, g + noise));
      b = Math.min(1, Math.max(0, b + noise));
    }

    out[i]     = Math.round(r * 255);
    out[i + 1] = Math.round(g * 255);
    out[i + 2] = Math.round(b * 255);
    out[i + 3] = src[i + 3];
  }

  const ctx = canvas.getContext("2d");
  ctx.putImageData(new ImageData(out, w, h), 0, 0);

  if (vignette > 0) {
    const v = vignette / 100;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${v * 0.75})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

function makeDownscaledImageData(img, maxPx) {
  const ratio = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);
  const offscreen = document.createElement("canvas");
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return { imageData: ctx.getImageData(0, 0, w, h), w, h };
}

export default function PhotoEditor({ photo, onBack, onClose }) {
  const canvasRef = useRef(null);
  const previewImageDataRef = useRef(null);
  const fullImageRef = useRef(null);
  const debounceRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activePreset, setActivePreset] = useState("none");
  const [adjustments, setAdjustments] = useState({ ...PRESETS.none });

  useEffect(() => {
    setReady(false);
    setError(false);
    setActivePreset("none");
    setAdjustments({ ...PRESETS.none });
    previewImageDataRef.current = null;
    fullImageRef.current = null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const { imageData, w, h } = makeDownscaledImageData(img, PREVIEW_MAX_PX);
      canvas.width = w;
      canvas.height = h;
      previewImageDataRef.current = imageData;
      fullImageRef.current = img;
      canvas.getContext("2d").putImageData(imageData, 0, 0);
      setReady(true);
    };
    img.onerror = () => {
      setError(true);
    };
    img.src = getPhotoUrlForCanvas(photo);
  }, [photo]);

  const runEdits = (nextAdjustments) => {
    if (!previewImageDataRef.current || !canvasRef.current) {
      return;
    }
    applyEditsToCanvas(canvasRef.current, previewImageDataRef.current, nextAdjustments);
  };

  useEffect(() => {
    if (!ready) {
      return;
    }
    runEdits(adjustments);
  }, [ready]);

  const handleSlider = (id, value) => {
    const next = { ...adjustments, [id]: Number(value) };
    setActivePreset("none");
    setAdjustments(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runEdits(next);
    }, 40);
  };

  const handlePreset = (name) => {
    const next = { ...PRESETS[name] };
    setActivePreset(name);
    setAdjustments(next);
    clearTimeout(debounceRef.current);
    runEdits(next);
  };

  const handleReset = () => {
    handlePreset("none");
  };

  const handleDownload = () => {
    const img = fullImageRef.current;
    if (!img) {
      return;
    }

    setDownloading(true);

    requestAnimationFrame(() => {
      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = img.naturalWidth;
      fullCanvas.height = img.naturalHeight;
      const ctx = fullCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const fullImageData = ctx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
      applyEditsToCanvas(fullCanvas, fullImageData, adjustments);

      const link = document.createElement("a");
      link.download = `${photo.header || "photo"}-edited.png`;
      link.href = fullCanvas.toDataURL("image/png");
      link.click();
      setDownloading(false);
    });
  };

  return (
    <div className="photo-editor">
      <div className="photo-editor-canvas-wrap">
        {!ready && !error && (
          <div className="photo-editor-loading">Loading image…</div>
        )}
        {error && (
          <div className="photo-editor-error">
            Unable to load image for editing. Ensure Firebase Storage CORS is configured.
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`photo-editor-canvas ${ready ? "is-ready" : ""}`}
        />
      </div>

      <div className="photo-editor-panel">
        <div className="photo-editor-presets">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              className={`editor-preset-btn ${activePreset === name ? "is-active" : ""}`}
              onClick={() => handlePreset(name)}
            >
              {name === "none" ? "None" : name === "bw" ? "B&W" : name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>

        <div className="photo-editor-sliders">
          {SLIDER_CONFIG.map(({ group, sliders }) => (
            <div key={group} className="editor-group">
              <div className="editor-group-title">{group}</div>
              {sliders.map(({ id, label, min, max }) => (
                <div key={id} className="editor-row">
                  <label className="editor-label">{label}</label>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={1}
                    value={adjustments[id]}
                    onChange={(e) => handleSlider(id, e.target.value)}
                  />
                  <span className="editor-val">{adjustments[id]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="photo-editor-actions">
          <button type="button" className="editor-action-reset" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="editor-action-back" onClick={onBack}>
            ← Back
          </button>
          <button
            type="button"
            className="editor-action-download"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Saving…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}