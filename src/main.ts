import "./style.css";
import type { ComfortSettings } from "./comfort";
import { browserStorage, loadComfort, sanitizeComfort, saveComfort } from "./comfort-settings";
import { createScene } from "./scene";
import { BUTTON_LABEL, describeXrError, detectXr, emulationTarget, emulatorUrl, headsetUrl } from "./xr-support";

const root = document.documentElement;

function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`index.html is missing #${id}`);
  return element;
}

const stage = byId("stage", HTMLElement);
const button = byId("enter-vr", HTMLButtonElement);
const statusLine = byId("xr-status", HTMLElement);
const tryEmulator = byId("try-emulator", HTMLAnchorElement);
const copyLink = byId("copy-link", HTMLButtonElement);
const comfortForm = byId("comfort-form", HTMLFormElement);

function setStatus(text: string, tone: "info" | "error" = "info") {
  statusLine.textContent = text;
  statusLine.dataset.tone = tone;
}

async function installEmulator(target: "quest2" | "quest3") {
  // Loaded only on ?emulate=..., so the production bundle path never ships the emulator.
  const { XRDevice, metaQuest2, metaQuest3 } = await import("iwer");
  const device = new XRDevice(target === "quest2" ? metaQuest2 : metaQuest3);
  // Desktop Chromium exposes a native navigator.xr with no headset; ?emulate is an explicit opt-in, so replace it.
  device.installRuntime({ forceInstall: true });
  root.dataset.xrEmulated = target;
}

/** Fills the comfort form from saved settings and applies every change to the scene. */
function bindComfortForm(form: HTMLFormElement, apply: (settings: ComfortSettings) => void) {
  const storage = browserStorage();
  const initial = loadComfort(storage);
  for (const input of form.querySelectorAll<HTMLInputElement>('input[name="snapAngleDeg"]')) {
    input.checked = Number(input.value) === initial.snapAngleDeg;
  }
  (form.elements.namedItem("vignette") as HTMLInputElement).checked = initial.vignette;
  (form.elements.namedItem("seated") as HTMLInputElement).checked = initial.seated;
  apply(initial);
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("change", () => {
    const data = new FormData(form);
    const settings = sanitizeComfort({
      snapAngleDeg: Number(data.get("snapAngleDeg")),
      vignette: data.has("vignette"),
      seated: data.has("seated"),
    });
    apply(settings);
    saveComfort(storage, settings);
  });
}

function showNoHeadsetActions(emulated: boolean) {
  // Never imply that real VR works here: the emulator link says it is emulated,
  // and the copy button hands the plain URL to a headset.
  if (!emulated) {
    tryEmulator.href = emulatorUrl(location.href);
    tryEmulator.hidden = false;
  }
  copyLink.hidden = false;
  copyLink.addEventListener("click", async () => {
    const url = headsetUrl(location.href);
    try {
      await navigator.clipboard.writeText(url);
      setStatus(`Link copied. Open ${url} in the Quest Browser and press Enter VR.`);
    } catch {
      setStatus(`Open ${url} in the Quest Browser and press Enter VR.`);
    }
  });
}

async function start() {
  const target = emulationTarget(location.search);
  if (target) await installEmulator(target);

  const starter = createScene(stage);
  bindComfortForm(comfortForm, (settings) => starter.setComfort(settings));
  root.dataset.xr = "inline";

  const availability = await detectXr({ isSecureContext: window.isSecureContext, xr: navigator.xr });
  root.dataset.xrAvailability = availability;
  const vrButton = button;
  vrButton.textContent = BUTTON_LABEL[availability];
  vrButton.disabled = availability !== "supported";
  if (availability === "supported") {
    setStatus(target ? "Emulated headset ready (no real VR on this device)." : "Headset ready.");
  } else {
    setStatus("Showing the 3D preview. Drag or use the arrow keys to look around.");
    showNoHeadsetActions(target !== null);
  }

  let session: XRSession | null = null;
  let starting = false;
  vrButton.addEventListener("click", async () => {
    if (session) {
      await session.end();
      return;
    }
    if (starting) return;
    starting = true;
    let next: XRSession | null = null;
    try {
      next = await navigator.xr!.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      });
      await starter.renderer.xr.setSession(next);
      session = next;
      root.dataset.xr = "immersive";
      vrButton.textContent = "Exit VR";
      setStatus("In VR. Point at the floor and press the trigger to teleport.");
      next.addEventListener("end", () => {
        session = null;
        root.dataset.xr = "inline";
        vrButton.textContent = BUTTON_LABEL.supported;
        setStatus("Headset ready.");
      });
    } catch (error) {
      // The runtime granted a session but the renderer could not take it: end it so the headset is released.
      if (next) await next.end().catch(() => undefined);
      session = null;
      console.error("Could not start VR", error);
      setStatus(describeXrError(error), "error");
    } finally {
      starting = false;
    }
  });
}

start().catch((error: unknown) => {
  root.dataset.xr = "error";
  console.error("VR Starter failed to start", error);
  setStatus("The 3D scene could not load. Reload the page, or try a browser with WebGL turned on.", "error");
});
