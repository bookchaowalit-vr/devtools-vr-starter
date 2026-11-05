// three.js glue for the reference scene: floor, one grabbable object, teleport
// and snap turn. Rules live in comfort.ts; keep this file thin.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  type Bounds,
  type ComfortSettings,
  DEFAULT_COMFORT,
  type SnapTurnState,
  isValidTeleportTarget,
  rigHeightOffset,
  snapTurn,
} from "./comfort";

const PLAY_AREA: Bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
const EYE_HEIGHT_INLINE = 1.6;
const FADE_MS = 150;

export interface StarterScene {
  renderer: THREE.WebGLRenderer;
  setComfort(settings: ComfortSettings): void;
}

export function createScene(container: HTMLElement): StarterScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.xr.setFoveation(1);
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "3D scene: a floor with one cube you can grab");
  renderer.domElement.setAttribute("role", "img");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10141c);

  // The rig moves for teleport and turns; the camera inside it is driven by the headset.
  const rig = new THREE.Group();
  scene.add(rig);
  const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.05, 100);
  camera.position.set(0, EYE_HEIGHT_INLINE, 2.5);
  rig.add(camera);

  scene.add(new THREE.HemisphereLight(0xdde6ff, 0x30302a, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 4, 1);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(PLAY_AREA.maxX - PLAY_AREA.minX, PLAY_AREA.maxZ - PLAY_AREA.minZ),
    new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.name = "floor";
  scene.add(floor);
  scene.add(new THREE.GridHelper(10, 10, 0x5b6b8c, 0x3a4458));

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.9, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x4a5670 }),
  );
  pedestal.position.set(0, 0.45, 0);
  scene.add(pedestal);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xf2a541, emissive: 0x000000 }),
  );
  cube.position.set(0, 1.0, 0);
  cube.name = "grabbable";
  scene.add(cube);

  // One teleport marker per controller, so each hand shows where it points.
  const markerGeometry = new THREE.RingGeometry(0.18, 0.24, 32).rotateX(-Math.PI / 2);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x7fd1ff });

  // Fade sphere for teleports and session changes: no hard cuts (comfort rule).
  const fade = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthTest: false }),
  );
  fade.renderOrder = 999;
  camera.add(fade);
  let fadeUntil = 0;

  let comfort: ComfortSettings = { ...DEFAULT_COMFORT };
  const turnState = new Map<XRInputSource, SnapTurnState>();
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const headWorld = new THREE.Vector3();
  const controllers: THREE.XRTargetRaySpace[] = [];
  let holder: THREE.Object3D | null = null;

  function grab(controller: THREE.Object3D) {
    controller.attach(cube);
    (cube.material as THREE.MeshStandardMaterial).emissive.setHex(0x332200);
    holder = controller;
  }

  function release() {
    scene.attach(cube);
    (cube.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    holder = null;
  }

  for (const index of [0, 1]) {
    const controller = renderer.xr.getController(index);
    const ray = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    );
    ray.scale.z = 4;
    controller.add(ray);
    rig.add(controller);
    controllers.push(controller);
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.visible = false;
    scene.add(marker);
    controller.userData.marker = marker;

    controller.addEventListener("selectstart", () => {
      // Only one hand holds the cube at a time; the other hand keeps teleporting.
      // The cube must be the first thing the ray meets, so it cannot be grabbed through the pedestal.
      if (holder === null && controller.visible && castFrom(controller, [floor, pedestal, cube])?.object === cube) {
        grab(controller);
      }
    });
    // selectend also fires when the action is cancelled (tracking lost, input removed),
    // so it only releases the cube; a teleport needs a completed select.
    controller.addEventListener("selectend", () => {
      if (holder === controller) release();
    });
    controller.addEventListener("select", () => {
      if (holder === controller || !controller.visible) return;
      const target = teleportTarget(controller);
      if (target) teleportTo(target);
    });
  }

  function castFrom(controller: THREE.Object3D, objects: THREE.Object3D[]) {
    // matrixWorld is only refreshed at render; input events and same-frame teleports/turns need the current pose.
    rig.updateMatrixWorld(true);
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(objects, false)[0];
  }

  function teleportTarget(controller: THREE.Object3D) {
    // Cast against everything solid: a ray that meets the pedestal or cube first must not land on the floor behind it.
    const hit = castFrom(controller, [floor, pedestal, cube]);
    if (!hit?.face || hit.object !== floor) return null;
    camera.getWorldPosition(headWorld);
    const normalY = hit.face.normal.clone().transformDirection(floor.matrixWorld).y;
    const target = { x: hit.point.x, y: hit.point.y, z: hit.point.z, normalY };
    return isValidTeleportTarget(target, { x: headWorld.x, z: headWorld.z }, PLAY_AREA) ? hit.point : null;
  }

  function teleportTo(point: THREE.Vector3) {
    camera.getWorldPosition(headWorld);
    rig.position.x += point.x - headWorld.x;
    rig.position.z += point.z - headWorld.z;
    fadeUntil = performance.now() + FADE_MS;
  }

  function turnRig(deltaYaw: number) {
    // Rotate around the head, not the rig origin, so the user does not slide sideways.
    camera.getWorldPosition(headWorld);
    rig.position.sub(headWorld).applyAxisAngle(THREE.Object3D.DEFAULT_UP, deltaYaw).add(headWorld);
    rig.rotation.y += deltaYaw;
  }

  const inlineControls = new OrbitControls(camera, renderer.domElement);
  inlineControls.target.set(0, 1, 0);
  inlineControls.enableDamping = false;
  inlineControls.update();

  renderer.xr.addEventListener("sessionstart", () => {
    camera.position.set(0, 0, 0);
    rig.position.set(0, rigHeightOffset(comfort), 2);
    rig.rotation.set(0, 0, 0);
    inlineControls.enabled = false;
    fadeUntil = performance.now() + FADE_MS;
  });
  renderer.xr.addEventListener("sessionend", () => {
    // A cube held when the session ends would stay attached to a controller that no longer moves.
    if (holder) release();
    for (const controller of controllers) controller.userData.marker.visible = false;
    rig.position.set(0, 0, 0);
    rig.rotation.set(0, 0, 0);
    camera.position.set(0, EYE_HEIGHT_INLINE, 2.5);
    inlineControls.enabled = true;
    inlineControls.update();
    turnState.clear();
  });

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  renderer.setAnimationLoop(() => {
    const session = renderer.xr.getSession();
    if (session) {
      for (const source of session.inputSources) {
        const axes = source.gamepad?.axes;
        if (!axes || axes.length < 4 || comfort.turnMode !== "snap") continue;
        const result = snapTurn(axes[2] ?? 0, turnState.get(source) ?? { armed: true }, comfort.snapAngleDeg);
        turnState.set(source, result.state);
        if (result.deltaYaw !== 0) turnRig(result.deltaYaw);
      }
      for (const controller of controllers) {
        const marker = controller.userData.marker as THREE.Mesh;
        // three.js hides a controller that lost tracking; its last pose must not drive the marker.
        const point = holder === controller || !controller.visible ? null : teleportTarget(controller);
        marker.visible = point !== null;
        if (point) marker.position.copy(point);
      }
    }
    const remaining = fadeUntil - performance.now();
    (fade.material as THREE.MeshBasicMaterial).opacity = remaining > 0 ? remaining / FADE_MS : 0;
    renderer.render(scene, camera);
  });

  return {
    renderer,
    setComfort(settings) {
      comfort = { ...settings };
    },
  };
}
