import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HouseDesignSpec } from '../../lib/houseDesign';

interface House3DViewerProps {
  spec: HouseDesignSpec;
  height?: number;
}

interface ModelPalette {
  wall: number;
  trim: number;
  glass: number;
  roof: number;
  accent: number;
  ground: number;
}

const PALETTES: Record<string, ModelPalette> = {
  'Standard Finish': { wall: 0xd8d0c1, trim: 0xf3efe7, glass: 0x7c9db2, roof: 0x3f4a52, accent: 0xc06a2c, ground: 0xcbcbc0 },
  'Elegant Finish': { wall: 0xe1e4e3, trim: 0xfcfcfa, glass: 0x6f90a7, roof: 0x30373c, accent: 0x1b4f8c, ground: 0xc7cbc4 },
  'Luxury Finish': { wall: 0x3b4248, trim: 0xc7b27c, glass: 0x5c7f96, roof: 0x171c20, accent: 0xc9a227, ground: 0xb8bdb4 },
};

function modelDimensions(spec: HouseDesignSpec) {
  const floors = spec.homeType === '3-Storey' ? 3 : spec.homeType === '2-Storey' ? 2 : 1;
  const floorHeight = spec.features.includes('High ceiling') ? 3.4 : 3;
  const footprint = Math.min(260, Math.max(36, spec.floorArea / floors));
  const depth = Math.min(14, Math.max(5, Math.sqrt(footprint / 1.45)));
  const width = Math.min(20, Math.max(6, footprint / depth));
  return {
    floors,
    floorHeight,
    width,
    depth,
    height: floors * floorHeight,
    flatRoof: ['Modern', 'Minimalist', 'Scandinavian', 'Luxury'].includes(spec.style),
  };
}

export default function House3DViewer({ spec, height = 420 }: House3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const palette = PALETTES[spec.finish] ?? PALETTES['Standard Finish'];
    const { floors, floorHeight, width, depth, height: houseHeight, flatRoof } = modelDimensions(spec);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe4ebef);
    scene.fog = new THREE.Fog(0xe4ebef, 45, 110);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 250);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b9aa3, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(14, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(100, 50, 0xffffff, 0xffffff);
    const gridMaterial = grid.material as THREE.LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.12;
    scene.add(grid);

    const house = new THREE.Group();
    scene.add(house);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: palette.wall, roughness: 0.88, metalness: 0.02 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: palette.trim, roughness: 0.72 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.8, metalness: 0.08 });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: palette.glass,
      roughness: 0.12,
      metalness: 0.45,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(palette.glass).multiplyScalar(0.08),
    });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.6 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 0.5, metalness: 0.15 });

    const addBox = (
      geometryWidth: number,
      geometryHeight: number,
      geometryDepth: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
      castShadow = true,
    ) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(geometryWidth, geometryHeight, geometryDepth), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      house.add(mesh);
      return mesh;
    };

    addBox(width, houseHeight, depth, 0, houseHeight / 2, 0, wallMaterial);
    addBox(width + 0.12, 0.16, depth + 0.12, 0, 0.08, 0, trimMaterial);

    for (let floor = 1; floor < floors; floor += 1) {
      addBox(width + 0.08, 0.1, depth + 0.08, 0, floor * floorHeight, 0, trimMaterial, false);
    }

    const windowHeight = spec.features.includes('High ceiling') ? 1.65 : 1.25;
    const addWindow = (x: number, y: number, z: number, face: 'front' | 'back' | 'left' | 'right', windowWidth: number) => {
      const frameWidth = face === 'left' || face === 'right' ? 0.12 : windowWidth + 0.14;
      const frameDepth = face === 'left' || face === 'right' ? windowWidth + 0.14 : 0.12;
      addBox(frameWidth, windowHeight + 0.14, frameDepth, x, y, z, trimMaterial, false);
      const glassWidth = face === 'left' || face === 'right' ? 0.14 : windowWidth;
      const glassDepth = face === 'left' || face === 'right' ? windowWidth : 0.14;
      addBox(glassWidth, windowHeight, glassDepth, x, y, z, glassMaterial, false);
      if (face === 'front' || face === 'back') {
        addBox(0.05, windowHeight, 0.16, x, y, z + (face === 'front' ? 0.02 : -0.02), trimMaterial, false);
      } else {
        addBox(0.16, windowHeight, 0.05, x + (face === 'right' ? 0.02 : -0.02), y, z, trimMaterial, false);
      }
    };

    const faceConfigs: { face: 'front' | 'back' | 'left' | 'right'; span: number; columns: number; place: (u: number, y: number) => [number, number, number] }[] = [
      { face: 'front', span: width, columns: width > 9 ? 3 : 2, place: (u, y) => [u, y, depth / 2 + 0.04] },
      { face: 'back', span: width, columns: width > 9 ? 3 : 2, place: (u, y) => [u, y, -depth / 2 - 0.04] },
      { face: 'right', span: depth, columns: depth > 8 ? 2 : 1, place: (u, y) => [width / 2 + 0.04, y, u] },
      { face: 'left', span: depth, columns: depth > 8 ? 2 : 1, place: (u, y) => [-width / 2 - 0.04, y, u] },
    ];

    for (const config of faceConfigs) {
      for (let floor = 0; floor < floors; floor += 1) {
        const y = floor * floorHeight + floorHeight / 2 + 0.35;
        for (let column = 0; column < config.columns; column += 1) {
          const u = -config.span / 2 + ((column + 0.5) * config.span) / config.columns;
          const isDoor = config.face === 'front' && floor === 0 && column === Math.floor(config.columns / 2);
          if (isDoor) {
            const [x, , z] = config.place(u, 0);
            addBox(1.3, 2.15, 0.14, x, 1.075, z, darkMaterial, false);
            const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), accentMaterial);
            knob.position.set(x + 0.45, 1.05, z + 0.09);
            house.add(knob);
          } else {
            const windowWidth = Math.min(1.55, (config.span / config.columns) * 0.52);
            const [x, , z] = config.place(u, y);
            addWindow(x, y, z, config.face, windowWidth);
          }
        }
      }
    }

    if (flatRoof) {
      addBox(width + 0.5, 0.24, depth + 0.5, 0, houseHeight + 0.12, 0, roofMaterial);
      const parapetHeight = 0.42;
      addBox(width + 0.5, parapetHeight, 0.18, 0, houseHeight + 0.42, depth / 2 + 0.25, roofMaterial);
      addBox(width + 0.5, parapetHeight, 0.18, 0, houseHeight + 0.42, -depth / 2 - 0.25, roofMaterial);
      addBox(0.18, parapetHeight, depth + 0.5, width / 2 + 0.25, houseHeight + 0.42, 0, roofMaterial);
      addBox(0.18, parapetHeight, depth + 0.5, -width / 2 - 0.25, houseHeight + 0.42, 0, roofMaterial);
    } else {
      const rise = 1.7;
      const frontLeft = [-width / 2, houseHeight, depth / 2];
      const frontRight = [width / 2, houseHeight, depth / 2];
      const frontPeak = [0, houseHeight + rise, depth / 2];
      const backLeft = [-width / 2, houseHeight, -depth / 2];
      const backRight = [width / 2, houseHeight, -depth / 2];
      const backPeak = [0, houseHeight + rise, -depth / 2];
      const slopeGeometry = new THREE.BufferGeometry();
      slopeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        ...frontLeft, ...frontPeak, ...backPeak,
        ...frontLeft, ...backPeak, ...backLeft,
        ...frontPeak, ...frontRight, ...backRight,
        ...frontPeak, ...backRight, ...backPeak,
      ], 3));
      slopeGeometry.computeVertexNormals();
      const slopes = new THREE.Mesh(slopeGeometry, roofMaterial);
      slopes.castShadow = true;
      slopes.receiveShadow = true;
      house.add(slopes);

      const gableGeometry = new THREE.BufferGeometry();
      gableGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        ...frontLeft, ...frontRight, ...frontPeak,
        ...backLeft, ...backPeak, ...backRight,
      ], 3));
      gableGeometry.computeVertexNormals();
      house.add(new THREE.Mesh(gableGeometry, wallMaterial));
    }

    if (spec.features.includes('Balcony') && floors > 1) {
      const balconyWidth = width * 0.56;
      const balconyY = floorHeight;
      addBox(balconyWidth, 0.18, 0.95, 0, balconyY, depth / 2 + 0.48, trimMaterial);
      addBox(balconyWidth, 0.09, 0.09, 0, balconyY + 1, depth / 2 + 0.95, trimMaterial);
      for (let index = 0; index <= 8; index += 1) {
        const x = -balconyWidth / 2 + (balconyWidth * index) / 8;
        addBox(0.06, 1, 0.06, x, balconyY + 0.5, depth / 2 + 0.95, trimMaterial, false);
      }
    }

    if (spec.features.includes('Carport')) {
      const carportX = width / 2 - 2;
      const carportZ = depth / 2 + 1.4;
      addBox(4.2, 0.2, 2.9, carportX, 2.7, carportZ, roofMaterial);
      for (const x of [carportX - 1.85, carportX + 1.85]) {
        for (const z of [carportZ - 1.2, carportZ + 1.2]) {
          const column = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.6, 10), trimMaterial);
          column.position.set(x, 1.3, z);
          column.castShadow = true;
          house.add(column);
        }
      }
    }

    if (spec.features.includes('Solar-ready')) {
      const panelY = flatRoof ? houseHeight + 0.32 : houseHeight + 0.95;
      for (let index = 0; index < 3; index += 1) {
        addBox(1.25, 0.07, 2.1, -width * 0.24 + index * 1.4, panelY, 0, darkMaterial, false);
      }
    }

    if (spec.features.includes('Landscaping') || spec.style === 'Tropical') {
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 });
      const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x6f9b63, roughness: 0.95 });
      for (const [x, z] of [[-width / 2 - 2, depth / 2 + 1.5], [width / 2 + 2, -depth / 2 - 1.5]] as const) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.3, 8), trunkMaterial);
        trunk.position.set(x, 0.65, z);
        trunk.castShadow = true;
        house.add(trunk);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.3, 9), leafMaterial);
        leaves.position.set(x, 2.2, z);
        leaves.castShadow = true;
        house.add(leaves);
      }
    }

    const target = new THREE.Vector3(0, houseHeight * 0.42, 0);
    let theta = Math.PI / 4;
    let phi = Math.PI / 3.2;
    let radius = Math.max(20, Math.max(width, depth) * 1.75);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      theta -= (event.clientX - lastX) * 0.008;
      phi = Math.min(Math.PI / 2.05, Math.max(0.25, phi - (event.clientY - lastY) * 0.006));
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      radius = Math.min(75, Math.max(12, radius + event.deltaY * 0.025));
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const nextWidth = mount.clientWidth || 640;
      const nextHeight = mount.clientHeight || height;
      renderer.setSize(nextWidth, nextHeight, false);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    const animate = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta),
      );
      camera.lookAt(target);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [spec, height]);

  return (
    <div className="space-y-2">
      <div ref={mountRef} style={{ height }} className="overflow-hidden rounded-lg border border-agdark-100 bg-agdark-50" />
      <div className="flex items-center justify-between rounded-lg bg-agdark-800 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
        <span>Interactive 3D model</span>
        <span className="font-monoData text-agdark-100">Drag to rotate · scroll to zoom</span>
      </div>
    </div>
  );
}
