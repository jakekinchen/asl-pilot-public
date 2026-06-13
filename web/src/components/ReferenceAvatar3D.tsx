"use client";

import { useEffect, useRef, useState } from "react";
import type {
  BufferAttribute,
  BufferGeometry,
  Line,
  Material,
  Mesh,
  Object3D,
  WebGLRenderer,
} from "three";
import {
  AVATAR_BODY_EDGES,
  AVATAR_HAND_EDGES,
  DEFAULT_REFERENCE_POSE,
  resolveAvatarPlaybackTime,
  sampleAvatarReferenceClip,
  type AvatarPoint3,
  type AvatarReferenceClip,
  type AvatarReferencePose,
} from "@/lib/avatar-motion";

export type ReferenceAvatarPlayback = {
  isPlaying: boolean;
  loop: boolean;
  speed: 0.5 | 1;
  mirrored: boolean;
  restartToken: number;
};

type ReferenceAvatar3DProps = {
  clip: AvatarReferenceClip | null;
  playback: ReferenceAvatarPlayback;
  onEnded?: () => void;
};

type AvatarSceneHandles = {
  root: Object3D;
  bodyJoints: Mesh[];
  leftHandJoints: Mesh[];
  rightHandJoints: Mesh[];
  bodyLines: Line[];
  leftHandLines: Line[];
  rightHandLines: Line[];
  headLines: Line[];
  leftTrail: Line;
  rightTrail: Line;
};

const GHOST_POINT_COUNT = 18;

export function ReferenceAvatar3D({ clip, playback, onEnded }: ReferenceAvatar3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef<AvatarReferenceClip | null>(clip);
  const playbackRef = useRef(playback);
  const onEndedRef = useRef(onEnded);
  const elapsedMsRef = useRef(0);
  const lastNowRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    clipRef.current = clip;
    elapsedMsRef.current = 0;
    lastNowRef.current = null;
    endedRef.current = false;
  }, [clip?.clipId]);

  useEffect(() => {
    elapsedMsRef.current = 0;
    lastNowRef.current = null;
    endedRef.current = false;
  }, [playback.restartToken]);

  useEffect(() => {
    let cancelled = false;
    let animationFrame = 0;
    let cleanupRenderer: (() => void) | null = null;

    async function init() {
      const mount = mountRef.current;
      if (!mount) return;
      const probe = document.createElement("canvas");
      const gl =
        probe.getContext("webgl") ?? probe.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }

      const THREE = await import("three");
      if (cancelled || !mountRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1.9, 1.9, 1.9, -1.9, 0.1, 50);
      camera.position.set(0, 0, 7);
      camera.lookAt(0, 0.2, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setClearColor(0x08070a, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.setAttribute("aria-label", "Reference ASL skeleton avatar");
      mountRef.current.appendChild(renderer.domElement);

      const keyLight = new THREE.DirectionalLight(0xf3ecdf, 2.1);
      keyLight.position.set(2.8, 3.2, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x5be9b9, 1.2);
      rimLight.position.set(-3, 1.5, 3);
      scene.add(rimLight);
      scene.add(new THREE.AmbientLight(0xd6cdb9, 0.8));

      const handles = createAvatarScene(THREE);
      scene.add(handles.root);

      const resize = () => {
        const currentMount = mountRef.current;
        if (!currentMount) return;
        const rect = currentMount.getBoundingClientRect();
        const width = Math.max(240, Math.round(rect.width));
        const height = Math.max(240, Math.round(rect.height));
        const aspect = width / height;
        const viewHeight = 3.8;
        camera.left = (-viewHeight * aspect) / 2;
        camera.right = (viewHeight * aspect) / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mountRef.current);
      resize();

      let firstFrameRendered = false;
      const leftTrail: AvatarPoint3[] = [];
      const rightTrail: AvatarPoint3[] = [];
      let lastDisplayTimeMs = 0;

      const animate = (now: number) => {
        if (cancelled) return;
        const controls = playbackRef.current;
        const currentClip = clipRef.current;
        const lastNow = lastNowRef.current ?? now;
        const deltaMs = Math.min(120, Math.max(0, now - lastNow));
        lastNowRef.current = now;

        if (currentClip && controls.isPlaying) {
          elapsedMsRef.current += deltaMs * controls.speed;
          if (!controls.loop && elapsedMsRef.current >= currentClip.durationMs) {
            elapsedMsRef.current = currentClip.durationMs;
            if (!endedRef.current) {
              endedRef.current = true;
              onEndedRef.current?.();
            }
          } else {
            endedRef.current = false;
          }
        }

        const displayTimeMs = currentClip
          ? resolveAvatarPlaybackTime(currentClip, elapsedMsRef.current, controls.loop)
          : 0;
        const pose = sampleAvatarReferenceClip(currentClip, displayTimeMs);
        if (displayTimeMs < lastDisplayTimeMs) {
          leftTrail.length = 0;
          rightTrail.length = 0;
        }
        lastDisplayTimeMs = displayTimeMs;
        updateAvatarScene(handles, pose, {
          mirrored: controls.mirrored,
          showGhostTrail: controls.speed === 0.5,
          leftTrail,
          rightTrail,
        });

        renderer.render(scene, camera);
        if (!firstFrameRendered) {
          firstFrameRendered = true;
          setReady(true);
        }
        animationFrame = window.requestAnimationFrame(animate);
      };
      animationFrame = window.requestAnimationFrame(animate);

      cleanupRenderer = () => {
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        disposeScene(handles.root, renderer);
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer.forceContextLoss();
      };
    }

    void init();

    return () => {
      cancelled = true;
      cleanupRenderer?.();
      cleanupRenderer = null;
    };
  }, []);

  return (
    <div
      className="robot-viewport reference-avatar-viewport"
      data-avatar-ready={ready ? "true" : "false"}
      data-avatar-source={clip ? "reference-clip" : "idle"}
      data-testid="reference-avatar-viewport"
      ref={mountRef}
    >
      {!webglSupported ? (
        <div className="robot-fallback" data-testid="reference-avatar-fallback">
          <span>3D reference unavailable</span>
          <p>Use the written prompt and coaching hint. No learner video is uploaded.</p>
        </div>
      ) : null}
    </div>
  );
}

function createAvatarScene(THREE: typeof import("three")): AvatarSceneHandles {
  const root = new THREE.Group();
  root.position.set(0, -0.12, 0);
  root.rotation.y = -0.08;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3ecdf,
    roughness: 0.62,
    metalness: 0.05,
  });
  const bodyLineMaterial = new THREE.LineBasicMaterial({
    color: 0x8fddd0,
    transparent: true,
    opacity: 0.62,
  });
  const leftMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6f91,
    roughness: 0.54,
    metalness: 0.08,
    emissive: 0x33131e,
    emissiveIntensity: 0.22,
  });
  const rightMaterial = new THREE.MeshStandardMaterial({
    color: 0x5be9b9,
    roughness: 0.52,
    metalness: 0.08,
    emissive: 0x153d32,
    emissiveIntensity: 0.28,
  });
  const leftLineMaterial = new THREE.LineBasicMaterial({ color: 0xff6f91 });
  const rightLineMaterial = new THREE.LineBasicMaterial({ color: 0x5be9b9 });
  const headLineMaterial = new THREE.LineBasicMaterial({
    color: 0xf4c25c,
    transparent: true,
    opacity: 0.86,
  });
  const leftTrailMaterial = new THREE.LineBasicMaterial({
    color: 0xff6f91,
    transparent: true,
    opacity: 0.3,
  });
  const rightTrailMaterial = new THREE.LineBasicMaterial({
    color: 0x5be9b9,
    transparent: true,
    opacity: 0.32,
  });

  const bodyJoints = DEFAULT_REFERENCE_POSE.body23.map((_, index) =>
    makeJoint(THREE, index === 0 || index === 1 ? 0.044 : 0.026, bodyMaterial),
  );
  const leftHandJoints = DEFAULT_REFERENCE_POSE.leftHand21.map((_, index) =>
    makeJoint(THREE, index === 0 ? 0.036 : 0.023, leftMaterial),
  );
  const rightHandJoints = DEFAULT_REFERENCE_POSE.rightHand21.map((_, index) =>
    makeJoint(THREE, index === 0 ? 0.036 : 0.023, rightMaterial),
  );
  bodyJoints.forEach((joint) => root.add(joint));
  leftHandJoints.forEach((joint) => root.add(joint));
  rightHandJoints.forEach((joint) => root.add(joint));

  const bodyLines = AVATAR_BODY_EDGES.map(() => makeLine(THREE, bodyLineMaterial));
  const leftHandLines = AVATAR_HAND_EDGES.map(() => makeLine(THREE, leftLineMaterial));
  const rightHandLines = AVATAR_HAND_EDGES.map(() => makeLine(THREE, rightLineMaterial));
  const headLines = [makeLine(THREE, headLineMaterial), makeLine(THREE, headLineMaterial)];
  const leftTrail = makeTrailLine(THREE, leftTrailMaterial);
  const rightTrail = makeTrailLine(THREE, rightTrailMaterial);
  [...bodyLines, ...leftHandLines, ...rightHandLines, ...headLines, leftTrail, rightTrail].forEach(
    (line) => root.add(line),
  );

  return {
    root,
    bodyJoints,
    leftHandJoints,
    rightHandJoints,
    bodyLines,
    leftHandLines,
    rightHandLines,
    headLines,
    leftTrail,
    rightTrail,
  };
}

function makeJoint(
  THREE: typeof import("three"),
  radius: number,
  material: Material,
): Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), material);
}

function makeLine(THREE: typeof import("three"), material: Material): Line {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  return new THREE.Line(geometry, material);
}

function makeTrailLine(THREE: typeof import("three"), material: Material): Line {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(GHOST_POINT_COUNT * 3), 3),
  );
  const line = new THREE.Line(geometry, material);
  line.visible = false;
  return line;
}

function updateAvatarScene(
  handles: AvatarSceneHandles,
  pose: AvatarReferencePose,
  options: {
    mirrored: boolean;
    showGhostTrail: boolean;
    leftTrail: AvatarPoint3[];
    rightTrail: AvatarPoint3[];
  },
) {
  const body = pose.body23.map((point) => orientPoint(point, options.mirrored));
  const leftHand = pose.leftHand21.map((point) => orientPoint(point, options.mirrored));
  const rightHand = pose.rightHand21.map((point) => orientPoint(point, options.mirrored));
  const headCenter = orientPoint(pose.head.center, options.mirrored);
  const headLookAt = orientPoint(pose.head.lookAt, options.mirrored);
  const headUp = orientPoint(pose.head.up, options.mirrored);

  setJointPositions(handles.bodyJoints, body);
  setJointPositions(handles.leftHandJoints, leftHand);
  setJointPositions(handles.rightHandJoints, rightHand);
  setEdgeLines(handles.bodyLines, AVATAR_BODY_EDGES, body);
  setEdgeLines(handles.leftHandLines, AVATAR_HAND_EDGES, leftHand);
  setEdgeLines(handles.rightHandLines, AVATAR_HAND_EDGES, rightHand);
  setLine(handles.headLines[0], headCenter, headLookAt);
  setLine(handles.headLines[1], headCenter, headUp);

  updateTrail(handles.leftTrail, options.leftTrail, body[9] ?? leftHand[0], options.showGhostTrail);
  updateTrail(
    handles.rightTrail,
    options.rightTrail,
    body[10] ?? rightHand[0],
    options.showGhostTrail,
  );
}

function setJointPositions(joints: Mesh[], points: AvatarPoint3[]) {
  joints.forEach((joint, index) => {
    const point = points[index];
    if (!point) return;
    joint.position.set(point[0], point[1], point[2]);
  });
}

function setEdgeLines(lines: Line[], edges: Array<[number, number]>, points: AvatarPoint3[]) {
  lines.forEach((line, index) => {
    const [a, b] = edges[index];
    setLine(line, points[a], points[b]);
  });
}

function setLine(line: Line, a: AvatarPoint3, b: AvatarPoint3) {
  const attribute = line.geometry.getAttribute("position") as BufferAttribute;
  attribute.setXYZ(0, a[0], a[1], a[2]);
  attribute.setXYZ(1, b[0], b[1], b[2]);
  attribute.needsUpdate = true;
}

function updateTrail(
  line: Line,
  trail: AvatarPoint3[],
  point: AvatarPoint3,
  visible: boolean,
) {
  if (!visible) {
    line.visible = false;
    trail.length = 0;
    return;
  }
  trail.push(point);
  while (trail.length > GHOST_POINT_COUNT) trail.shift();
  const attribute = line.geometry.getAttribute("position") as BufferAttribute;
  const fill = trail[0] ?? point;
  for (let index = 0; index < GHOST_POINT_COUNT; index += 1) {
    const sample = trail[index] ?? fill;
    attribute.setXYZ(index, sample[0], sample[1], sample[2]);
  }
  attribute.needsUpdate = true;
  line.visible = trail.length > 1;
}

function orientPoint(point: AvatarPoint3, mirrored: boolean): AvatarPoint3 {
  return [mirrored ? -point[0] : point[0], point[1], point[2]];
}

function disposeScene(root: Object3D, renderer: WebGLRenderer) {
  root.traverse((object) => {
    const candidate = object as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };
    candidate.geometry?.dispose();
    if (Array.isArray(candidate.material)) {
      candidate.material.forEach((material) => material.dispose());
    } else {
      candidate.material?.dispose();
    }
  });
  renderer.renderLists.dispose();
}
