"use client";

import { useEffect, useRef } from "react";
import type { Object3D, Bone } from "three";
import type { ReferenceAvatarPlayback } from "@/components/ReferenceAvatar3D";
import {
  type AvatarReferenceClip,
  sampleAvatarReferenceClip,
  resolveAvatarPlaybackTime,
} from "@/lib/avatar-motion";

type Props = { clip: AvatarReferenceClip | null; playback: ReferenceAvatarPlayback };

const MODEL_URL = "/avatar/xbot.glb";

// our body23 indices
const J = { lsh: 5, rsh: 6, lel: 7, rel: 8, lwr: 9, rwr: 10 };

export function HumanAvatar3D({ clip, playback }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const clipRef = useRef(clip);
  const playbackRef = useRef(playback);
  const elapsedRef = useRef(0);
  const lastNowRef = useRef<number | null>(null);

  useEffect(() => { playbackRef.current = playback; }, [playback]);
  useEffect(() => { clipRef.current = clip; elapsedRef.current = 0; lastNowRef.current = null; }, [clip?.clipId]);
  useEffect(() => { elapsedRef.current = 0; lastNowRef.current = null; }, [playback.restartToken]);

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
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (cancelled || !mountRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x08070a, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      mountRef.current.appendChild(renderer.domElement);

      const key = new THREE.DirectionalLight(0xfff4e2, 2.4); key.position.set(2, 4, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0x8fc7ff, 1.0); rim.position.set(-3, 2, -2); scene.add(rim);
      scene.add(new THREE.AmbientLight(0xcfc4ad, 0.7));

      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      if (cancelled) return;
      const model = gltf.scene as Object3D;
      scene.add(model);

      // collect bones
      const bones: Record<string, Bone> = {};
      model.traverse((o) => {
        const b = o as Bone;
        if (b.isBone) bones[b.name.replace(/^mixamorig:?/, "")] = b;
      });

      // frame the upper body by the model's actual bounding box (Mixamo ~100-unit scale)
      model.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const ctr = box.getCenter(new THREE.Vector3());
      const focusY = box.max.y - size.y * 0.26; // shoulders/upper-chest
      const dist = size.y * 1.05;
      camera.position.set(ctr.x, focusY, box.max.z + dist);
      camera.lookAt(ctr.x, focusY, ctr.z);

      // --- retarget plumbing -------------------------------------------------
      // bone -> [parentJoint, childJoint] in OUR data; orient bone's bind dir-to-child to the data target.
      const ARM_CHAIN: Array<[string, number, number]> = [
        ["LeftArm", J.lsh, J.lel], ["LeftForeArm", J.lel, J.lwr],
        ["RightArm", J.rsh, J.rel], ["RightForeArm", J.rel, J.rwr],
      ];
      // precompute bind-pose world dir to child for each chain bone
      type Pre = { bone: Bone; restDir: import("three").Vector3; bindWorldQ: import("three").Quaternion };
      const pres: Record<string, Pre> = {};
      const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
      // Only the arm bones are data-driven. The hand + fingers stay in the rig's
      // natural bind pose (relative to the forearm), so the wrist and handshape always
      // read anatomically — the noisy hand landmarks can't pin down 3D palm/wrist
      // orientation, and forcing it produced claws, blobs, and bent-back wrists.
      const childBoneOf: Record<string, string> = { LeftArm: "LeftForeArm", LeftForeArm: "LeftHand", RightArm: "RightForeArm", RightForeArm: "RightHand" };
      Object.keys(childBoneOf).forEach((bn) => {
        const bone = bones[bn], child = bones[childBoneOf[bn]];
        if (!bone || !child) return;
        bone.updateWorldMatrix(true, false); child.updateWorldMatrix(true, false);
        const restDir = child.getWorldPosition(tmpB).sub(bone.getWorldPosition(tmpA)).normalize().clone();
        const bindWorldQ = bone.getWorldQuaternion(new THREE.Quaternion());
        pres[bn] = { bone, restDir, bindWorldQ };
      });

      // map our data point (avatar space: x viewer-right, y up, z toward camera) into the
      // model's world frame. Mixamo faces +Z; our z is toward-camera. Start identity, calibrate.
      const dpt = (p: number[]) => new THREE.Vector3(p[0], p[1], -p[2]);

      const swing = new THREE.Quaternion();
      const desired = new THREE.Quaternion();
      const parentQ = new THREE.Quaternion();
      const orientBone = (bn: string, parentData: number[], childData: number[]) => {
        const pre = pres[bn];
        if (!pre) return;
        const target = dpt(childData).sub(dpt(parentData));
        // degenerate segment (e.g. resting hand collapsed to the wrist) → leave bind pose
        if (target.lengthSq() < 1e-6) return;
        target.normalize();
        swing.setFromUnitVectors(pre.restDir, target);
        desired.copy(swing).multiply(pre.bindWorldQ);
        const parent = pre.bone.parent;
        if (parent) { parent.updateWorldMatrix(true, false); parent.getWorldQuaternion(parentQ); pre.bone.quaternion.copy(parentQ.invert().multiply(desired)); }
        pre.bone.updateWorldMatrix(true, false);
      };

      const resize = () => {
        const cur = mountRef.current; if (!cur) return;
        const rect = cur.getBoundingClientRect();
        const w = Math.max(240, Math.round(rect.width)), h = Math.max(240, Math.round(rect.height));
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
      };
      const ro = new ResizeObserver(resize); ro.observe(mountRef.current); resize();

      const animate = (now: number) => {
        if (cancelled) return;
        const controls = playbackRef.current, clipNow = clipRef.current;
        const last = lastNowRef.current ?? now; const delta = Math.min(120, Math.max(0, now - last)); lastNowRef.current = now;
        if (clipNow && controls.isPlaying) {
          elapsedRef.current += delta * controls.speed;
          if (!controls.loop && elapsedRef.current >= clipNow.durationMs) elapsedRef.current = clipNow.durationMs;
        }
        if (clipNow) {
          const t = resolveAvatarPlaybackTime(clipNow, elapsedRef.current, controls.loop);
          const pose = sampleAvatarReferenceClip(clipNow, t);
          // Default (no swap) matches the source video: the signing hand lands on the
          // same viewer-side as the real signer (verified with L/R bone markers vs the
          // source frame). The `mirrored` toggle reflects across x AND swaps left<->right
          // sources to produce a true mirror image (e.g. to match a selfie camera).
          const m = controls.mirrored;
          const mp = (p: number[]) => (m ? [-p[0], p[1], p[2]] : p);
          let b23: number[][] = pose.body23;
          if (m) {
            b23 = pose.body23.map(mp);
            for (const [a, c] of [[5, 6], [7, 8], [9, 10]] as const) {
              const tmp = b23[a]; b23[a] = b23[c]; b23[c] = tmp;
            }
          }
          // Orient ONLY the arms (parent-first). Hands/fingers ride along in the rig's
          // natural bind pose, so the wrist + handshape always look anatomically right.
          ARM_CHAIN.forEach(([bn, pj, cj]) => orientBone(bn, b23[pj], b23[cj]));
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);

      cleanup = () => {
        ro.disconnect(); cancelAnimationFrame(raf); renderer.dispose();
        if (renderer.domElement.parentElement === mountRef.current) mountRef.current?.removeChild(renderer.domElement);
      };
    })();

    return () => { cancelled = true; if (cleanup) cleanup(); };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
