"use client";

import { useEffect, useRef } from "react";
import type { Material, Mesh } from "three";
import type { ReferenceAvatarPlayback } from "@/components/ReferenceAvatar3D";
import {
  type AvatarReferenceClip,
  type AvatarPoint3,
  AVATAR_BODY_EDGES,
  AVATAR_HAND_EDGES,
  sampleAvatarReferenceClip,
  resolveAvatarPlaybackTime,
} from "@/lib/avatar-motion";

type Props = { clip: AvatarReferenceClip | null; playback: ReferenceAvatarPlayback };

// Body23 indices we treat specially.
const HEAD = 1;
const NOSE = 2;
const FACE_JOINTS = new Set([2, 3, 4, 15, 16, 17]); // nose, ears, eyes, mouth — hide as bulk
const HAND_ANCHORS = new Set([18, 19, 20, 21]); // duplicate wrist/index anchors — hide
const HIDE_SPHERES = new Set([0, 14, 22]); // chest, spine, pelvis — internal, would float as balls

export function SolidMannequin3D({ clip, playback }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef(clip);
  const playbackRef = useRef(playback);
  const elapsedRef = useRef(0);
  const lastNowRef = useRef<number | null>(null);

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);
  useEffect(() => {
    clipRef.current = clip;
    elapsedRef.current = 0;
    lastNowRef.current = null;
  }, [clip?.clipId]);
  useEffect(() => {
    elapsedRef.current = 0;
    lastNowRef.current = null;
  }, [playback.restartToken]);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    void (async () => {
      const mount = mountRef.current;
      if (!mount) return;
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl") ?? probe.getContext("experimental-webgl"))) return;
      const THREE = await import("three");
      if (cancelled || !mountRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1.9, 1.9, 1.9, -1.9, 0.1, 50);
      camera.position.set(0, 0, 7);
      camera.lookAt(0, 0.15, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setClearColor(0x08070a, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.setAttribute("aria-label", "ASL reference mannequin");
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      mountRef.current.appendChild(renderer.domElement);

      const addLight = (color: number, intensity: number, x: number, y: number, z: number) => {
        const l = new THREE.DirectionalLight(color, intensity);
        l.position.set(x, y, z);
        scene.add(l);
      };
      addLight(0xfff4e2, 2.6, 2.5, 3.6, 5);
      addLight(0x6fb7ff, 1.0, -3.4, 1.2, 2.5);
      addLight(0x56d39a, 0.7, 0, -2.5, 3);
      scene.add(new THREE.AmbientLight(0xcfc4ad, 0.55));

      const root = new THREE.Group();
      scene.add(root);

      const limbMat = new THREE.MeshStandardMaterial({ color: 0xe7dcc6, roughness: 0.55, metalness: 0.25 });
      const jointMat = new THREE.MeshStandardMaterial({ color: 0xf6ead2, roughness: 0.4, metalness: 0.3 });
      const headMat = new THREE.MeshStandardMaterial({ color: 0xefe3cb, roughness: 0.5, metalness: 0.2 });
      const leftMat = new THREE.MeshStandardMaterial({ color: 0xef7d9b, roughness: 0.5, metalness: 0.2 });
      const rightMat = new THREE.MeshStandardMaterial({ color: 0x57d8b2, roughness: 0.5, metalness: 0.2 });

      const cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
      const sph = new THREE.SphereGeometry(1, 18, 14);

      const mkBone = (mat: Material, r: number) => {
        const m = new THREE.Mesh(cyl, mat);
        m.userData.r = r;
        root.add(m);
        return m;
      };
      const mkJoint = (mat: Material, r: number) => {
        const m = new THREE.Mesh(sph, mat);
        m.scale.setScalar(r);
        root.add(m);
        return m;
      };

      // body bones + joints
      const bodyBones = AVATAR_BODY_EDGES.map(() => mkBone(limbMat, 0.055));
      const bodyJoints = Array.from({ length: 23 }, (_, i) =>
        FACE_JOINTS.has(i) || HAND_ANCHORS.has(i) || HIDE_SPHERES.has(i)
          ? null
          : mkJoint(jointMat, i === HEAD ? 0.19 : 0.07),
      );
      // hand bones + joints (both hands)
      const handBones = {
        left: AVATAR_HAND_EDGES.map(() => mkBone(leftMat, 0.018)),
        right: AVATAR_HAND_EDGES.map(() => mkBone(rightMat, 0.018)),
      };
      const handJoints = {
        left: Array.from({ length: 21 }, () => mkJoint(leftMat, 0.026)),
        right: Array.from({ length: 21 }, () => mkJoint(rightMat, 0.026)),
      };

      const A = new THREE.Vector3();
      const B = new THREE.Vector3();
      const dir = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      const pt = (p: AvatarPoint3, mir: boolean) => A.set(mir ? -p[0] : p[0], p[1], p[2]);

      const orient = (mesh: Mesh, a: AvatarPoint3, b: AvatarPoint3, mir: boolean) => {
        pt(a, mir);
        B.set(mir ? -b[0] : b[0], b[1], b[2]);
        const len = A.distanceTo(B);
        const r = mesh.userData.r as number;
        if (len < 1e-4) {
          mesh.visible = false;
          return;
        }
        mesh.visible = true;
        mesh.position.copy(A).add(B).multiplyScalar(0.5);
        dir.copy(B).sub(A).normalize();
        mesh.quaternion.setFromUnitVectors(up, dir);
        mesh.scale.set(r, len, r);
      };

      const resize = () => {
        const cur = mountRef.current;
        if (!cur) return;
        const rect = cur.getBoundingClientRect();
        const w = Math.max(240, Math.round(rect.width));
        const h = Math.max(240, Math.round(rect.height));
        const aspect = w / h;
        const vh = 3.7;
        camera.left = (-vh * aspect) / 2;
        camera.right = (vh * aspect) / 2;
        camera.top = vh / 2;
        camera.bottom = -vh / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(mountRef.current);
      resize();

      const animate = (now: number) => {
        if (cancelled) return;
        const controls = playbackRef.current;
        const clipNow = clipRef.current;
        const last = lastNowRef.current ?? now;
        const delta = Math.min(120, Math.max(0, now - last));
        lastNowRef.current = now;
        if (clipNow && controls.isPlaying) {
          elapsedRef.current += delta * controls.speed;
          if (!controls.loop && elapsedRef.current >= clipNow.durationMs) elapsedRef.current = clipNow.durationMs;
        }
        const mir = controls.mirrored;
        const t = clipNow ? resolveAvatarPlaybackTime(clipNow, elapsedRef.current, controls.loop) : 0;
        const pose = sampleAvatarReferenceClip(clipNow, t);

        AVATAR_BODY_EDGES.forEach(([i, j], k) => {
          if (FACE_JOINTS.has(i) || FACE_JOINTS.has(j) || HAND_ANCHORS.has(i) || HAND_ANCHORS.has(j)) {
            bodyBones[k].visible = false;
            return;
          }
          orient(bodyBones[k], pose.body23[i], pose.body23[j], mir);
        });
        bodyJoints.forEach((joint, i) => {
          if (!joint) return;
          const p = pose.body23[i];
          joint.position.set(mir ? -p[0] : p[0], p[1], p[2]);
        });
        // a touch of head fill: nudge the head sphere toward the nose so it reads as a head
        if (bodyJoints[HEAD]) {
          const head = pose.body23[HEAD];
          const nose = pose.body23[NOSE];
          bodyJoints[HEAD]!.position.set(
            mir ? -(head[0] + nose[0]) / 2 : (head[0] + nose[0]) / 2,
            (head[1] + nose[1]) / 2,
            (head[2] + nose[2]) / 2,
          );
        }

        (["left", "right"] as const).forEach((side) => {
          const hand = side === "left" ? pose.leftHand21 : pose.rightHand21;
          AVATAR_HAND_EDGES.forEach(([i, j], k) => orient(handBones[side][k], hand[i], hand[j], mir));
          handJoints[side].forEach((joint, i) => {
            const p = hand[i];
            joint.position.set(mir ? -p[0] : p[0], p[1], p[2]);
          });
        });

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      cleanup = () => {
        ro.disconnect();
        cancelAnimationFrame(raf);
        renderer.dispose();
        cyl.dispose();
        sph.dispose();
        [limbMat, jointMat, headMat, leftMat, rightMat].forEach((m) => m.dispose());
        if (renderer.domElement.parentElement === mountRef.current) {
          mountRef.current?.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
