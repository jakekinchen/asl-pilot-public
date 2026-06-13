"use client";

import { useEffect, useRef, useState } from "react";
import type { BufferGeometry, Material, Object3D, WebGLRenderer } from "three";
import type { AvatarDriverState } from "@/lib/avatar-motion";

type RobotMannequin3DProps = {
  state: AvatarDriverState;
};

export function RobotMannequin3D({ state }: RobotMannequin3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef(state.mode);
  const [ready, setReady] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    modeRef.current = state.mode;
  }, [state.mode]);

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
      const camera = new THREE.OrthographicCamera(-2.1, 2.1, 2.1, -2.1, 0.1, 50);
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setClearColor(0x08070a, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.setAttribute("aria-label", "Procedural robot mannequin");
      mountRef.current.appendChild(renderer.domElement);

      const keyLight = new THREE.DirectionalLight(0xf3ecdf, 2.3);
      keyLight.position.set(2.8, 3.2, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x5be9b9, 1.15);
      rimLight.position.set(-3, 1.5, 3);
      scene.add(rimLight);
      scene.add(new THREE.AmbientLight(0xd6cdb9, 0.8));

      const graphite = new THREE.MeshStandardMaterial({
        color: 0x25232b,
        roughness: 0.62,
        metalness: 0.18,
      });
      const jointMaterial = new THREE.MeshStandardMaterial({
        color: 0x5be9b9,
        roughness: 0.42,
        metalness: 0.28,
        emissive: 0x153d32,
        emissiveIntensity: 0.35,
      });
      const handMaterial = new THREE.MeshStandardMaterial({
        color: 0xf3ecdf,
        roughness: 0.58,
        metalness: 0.08,
      });

      const robot = new THREE.Group();
      robot.position.y = -0.05;
      scene.add(robot);

      const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.48, 0.82, 8, 20),
        graphite,
      );
      torso.position.y = -0.2;
      torso.scale.x = 1.18;
      robot.add(torso);

      const chestSignal = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.012, 8, 36),
        jointMaterial,
      );
      chestSignal.position.set(0, 0.0, 0.5);
      robot.add(chestSignal);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.22, 20),
        graphite,
      );
      neck.position.y = 0.72;
      robot.add(neck);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 20), graphite);
      head.position.y = 1.12;
      robot.add(head);

      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.08, 0.035),
        jointMaterial,
      );
      visor.position.set(0, 1.13, 0.32);
      robot.add(visor);

      const shoulderBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 1.72, 20),
        jointMaterial,
      );
      shoulderBar.rotation.z = Math.PI / 2;
      shoulderBar.position.y = 0.43;
      robot.add(shoulderBar);

      const leftArm = makeArm(THREE, -1, graphite, jointMaterial, handMaterial);
      const rightArm = makeArm(THREE, 1, graphite, jointMaterial, handMaterial);
      robot.add(leftArm.group, rightArm.group);

      const floorLine = new THREE.Mesh(
        new THREE.BoxGeometry(2.55, 0.018, 0.018),
        jointMaterial,
      );
      floorLine.position.y = -1.72;
      robot.add(floorLine);

      const resize = () => {
        const currentMount = mountRef.current;
        if (!currentMount) return;
        const rect = currentMount.getBoundingClientRect();
        const width = Math.max(240, Math.round(rect.width));
        const height = Math.max(240, Math.round(rect.height));
        const aspect = width / height;
        const viewHeight = 4.2;
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

      const clock = new THREE.Clock();
      let firstFrameRendered = false;
      const animate = () => {
        if (cancelled) return;
        const elapsed = clock.getElapsedTime();
        const mode = modeRef.current;
        const idle = Math.sin(elapsed * 1.25);
        const scaffold = Math.sin(elapsed * 2.6);

        robot.rotation.y = idle * 0.035;
        torso.scale.y = 1 + idle * 0.012;
        head.position.y = 1.12 + idle * 0.025;
        visor.scale.x = 1 + Math.sin(elapsed * 1.8) * 0.03;

        if (mode === "demo") {
          leftArm.group.rotation.z = -0.38 + scaffold * 0.18;
          rightArm.group.rotation.z = 0.38 - scaffold * 0.18;
          leftArm.forearm.rotation.z = 0.68 + scaffold * 0.24;
          rightArm.forearm.rotation.z = -0.68 - scaffold * 0.24;
          leftArm.hand.position.y = -1.02 + Math.max(0, scaffold) * 0.16;
          rightArm.hand.position.y = -1.02 + Math.max(0, -scaffold) * 0.16;
        } else {
          leftArm.group.rotation.z = -0.16 + idle * 0.035;
          rightArm.group.rotation.z = 0.16 - idle * 0.035;
          leftArm.forearm.rotation.z = 0.48 + idle * 0.035;
          rightArm.forearm.rotation.z = -0.48 - idle * 0.035;
          leftArm.hand.position.y = -1.04;
          rightArm.hand.position.y = -1.04;
        }

        renderer.render(scene, camera);
        if (!firstFrameRendered) {
          firstFrameRendered = true;
          setReady(true);
        }
        animationFrame = window.requestAnimationFrame(animate);
      };
      animate();

      cleanupRenderer = () => {
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        disposeScene(robot, renderer);
        graphite.dispose();
        jointMaterial.dispose();
        handMaterial.dispose();
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
      className="robot-viewport"
      data-avatar-mode={state.mode}
      data-avatar-ready={ready ? "true" : "false"}
      data-testid="robot-viewport"
      ref={mountRef}
    >
      {!webglSupported ? (
        <div className="robot-fallback" data-testid="robot-fallback">
          <span>3D unavailable</span>
          <p>Robot scaffold is idle; detector feed unavailable.</p>
        </div>
      ) : null}
    </div>
  );
}

function makeArm(
  THREE: typeof import("three"),
  side: -1 | 1,
  limbMaterial: Material,
  jointMaterial: Material,
  handMaterial: Material,
) {
  const group = new THREE.Group();
  group.position.set(side * 0.74, 0.34, 0);

  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), jointMaterial);
  group.add(shoulder);

  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.07, 0.64, 18),
    limbMaterial,
  );
  upper.position.set(side * 0.11, -0.34, 0);
  upper.rotation.z = side * 0.2;
  group.add(upper);

  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 12), jointMaterial);
  elbow.position.set(side * 0.2, -0.66, 0);
  group.add(elbow);

  const forearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.064, 0.66, 18),
    limbMaterial,
  );
  forearm.position.set(side * 0.32, -0.88, 0);
  forearm.rotation.z = side * -0.48;
  group.add(forearm);

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), handMaterial);
  hand.position.set(side * 0.47, -1.04, 0.02);
  hand.rotation.z = side * 0.08;
  group.add(hand);

  return { group, forearm, hand };
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
