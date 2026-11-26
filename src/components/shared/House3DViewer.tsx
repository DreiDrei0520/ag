import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import HouseFloorPlan from './HouseFloorPlan';
import { buildHousePlan, type ExteriorFace, type HousePlan, type MassVolume, type Room } from '../../lib/houseLayout';
import type { HouseDesignSpec } from '../../lib/houseDesign';

interface House3DViewerProps {
  spec: HouseDesignSpec;
  height?: number;
  seed?: number;
}

export type RenderView = 'front' | 'corner' | 'aerial';
export type LightingMode = 'day' | 'night';

export interface HouseRenderCapture {
  image: string;
  view: RenderView;
  lighting: LightingMode;
}

export interface House3DViewerHandle {
  capture: (view: RenderView, lighting: LightingMode) => string | null;
  setLighting: (lighting: LightingMode) => void;
}

interface ViewerState {
  applyPreset: (view: RenderView) => void;
  setLighting: (lighting: LightingMode) => void;
  capture: (view: RenderView, lighting: LightingMode) => string | null;
}

type TextureKind = 'stucco' | 'wood' | 'stone' | 'roof' | 'grass' | 'concrete' | 'solar';

interface Palette {
  wall: string;
  trim: string;
  wood: string;
  stone: string;
  roof: string;
  metal: string;
  glass: string;
  door: string;
  accent: string;
  ground: string;
}

interface Opening {
  u: number;
  width: number;
  bottom: number;
  top: number;
  kind: 'window' | 'door';
}

interface Materials {
  wall: THREE.MeshStandardMaterial;
  wallWarm: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  darkGlass: THREE.MeshPhysicalMaterial;
  door: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
  solar: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial[];
  trunk: THREE.MeshStandardMaterial;
  light: THREE.MeshBasicMaterial;
  interiors: THREE.MeshStandardMaterial;
}

function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createTexture(kind: TextureKind, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const random = seeded(seed);
  const bases: Record<TextureKind, string> = {
    stucco: '#d8d2c6',
    wood: '#8a5c38',
    stone: '#a8a196',
    roof: '#41484d',
    grass: '#76945c',
    concrete: '#b7b5ad',
    solar: '#152a3d',
  };
  ctx.fillStyle = bases[kind];
  ctx.fillRect(0, 0, 512, 512);

  if (kind === 'stucco') {
    for (let index = 0; index < 20000; index += 1) {
      const shade = Math.floor(170 + random() * 80);
      ctx.fillStyle = `rgba(${shade},${shade - 4},${shade - 12},${0.05 + random() * 0.12})`;
      ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2);
    }
    for (let index = 0; index < 180; index += 1) {
      ctx.strokeStyle = `rgba(255,255,255,${0.04 + random() * 0.06})`;
      ctx.lineWidth = 1 + random() * 2;
      const y = random() * 512;
      ctx.beginPath();
      ctx.moveTo(random() * 120, y);
      ctx.lineTo(200 + random() * 312, y + (random() - 0.5) * 4);
      ctx.stroke();
    }
  } else if (kind === 'wood') {
    for (let plank = 0; plank < 8; plank += 1) {
      const x = plank * 64;
      const tone = 96 + Math.floor(random() * 42);
      ctx.fillStyle = `rgb(${tone + 42},${tone + 8},${tone - 24})`;
      ctx.fillRect(x, 0, 62, 512);
      for (let index = 0; index < 55; index += 1) {
        ctx.strokeStyle = `rgba(40,22,10,${0.06 + random() * 0.14})`;
        ctx.lineWidth = 0.5 + random() * 1.4;
        const gx = x + random() * 62;
        ctx.beginPath();
        ctx.moveTo(gx, random() * 512);
        ctx.bezierCurveTo(gx + random() * 4, 180, gx - random() * 4, 340, gx + random() * 3, 512);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(30,16,8,0.3)';
      ctx.fillRect(x + 62, 0, 2, 512);
    }
  } else if (kind === 'stone') {
    for (let row = 0; row < 9; row += 1) {
      const offset = row % 2 === 0 ? 0 : 44;
      for (let column = -1; column < 5; column += 1) {
        const x = column * 104 + offset;
        const y = row * 58;
        const tone = 136 + Math.floor(random() * 40);
        ctx.fillStyle = `rgb(${tone},${tone - 3},${tone - 10})`;
        ctx.fillRect(x + 2, y + 2, 100, 54);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x + 2, y + 2, 100, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + 2, y + 50, 100, 6);
      }
    }
    for (let index = 0; index < 12000; index += 1) {
      ctx.fillStyle = `rgba(20,18,15,${random() * 0.09})`;
      ctx.fillRect(random() * 512, random() * 512, 2, 2);
    }
  } else if (kind === 'roof') {
    for (let row = 0; row < 12; row += 1) {
      const y = row * 43;
      ctx.fillStyle = `rgba(255,255,255,${0.02 + random() * 0.06})`;
      ctx.fillRect(0, y, 512, 2);
      for (let column = 0; column < 10; column += 1) {
        const x = column * 52 + (row % 2) * 26;
        ctx.fillStyle = `rgba(0,0,0,${0.08 + random() * 0.1})`;
        ctx.fillRect(x, y + 2, 2, 40);
        ctx.fillStyle = `rgba(255,255,255,${0.02 + random() * 0.05})`;
        ctx.fillRect(x + 3, y + 3, 46, 36);
      }
    }
  } else if (kind === 'grass') {
    for (let index = 0; index < 34000; index += 1) {
      const tone = 88 + Math.floor(random() * 76);
      ctx.fillStyle = `rgba(${tone - 22},${tone},${Math.floor(tone * 0.62)},${0.14 + random() * 0.34})`;
      const x = random() * 512;
      const y = random() * 512;
      ctx.fillRect(x, y, 1 + random() * 2, 2 + random() * 4);
    }
  } else if (kind === 'concrete') {
    for (let index = 0; index < 22000; index += 1) {
      const tone = 150 + Math.floor(random() * 90);
      ctx.fillStyle = `rgba(${tone},${tone},${tone - 4},${0.05 + random() * 0.14})`;
      ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2);
    }
    ctx.strokeStyle = 'rgba(60,60,58,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 510, 510);
  } else {
    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        ctx.fillStyle = `rgba(56,98,132,${0.2 + random() * 0.25})`;
        ctx.fillRect(column * 64 + 3, row * 64 + 3, 58, 58);
        ctx.strokeStyle = 'rgba(200,214,224,0.42)';
        ctx.lineWidth = 1;
        ctx.strokeRect(column * 64 + 3.5, row * 64 + 3.5, 57, 57);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (kind === 'grass') texture.repeat.set(26, 26);
  if (kind === 'stucco') texture.repeat.set(4, 2);
  if (kind === 'stone') texture.repeat.set(3, 1.5);
  if (kind === 'roof') texture.repeat.set(6, 4);
  if (kind === 'concrete') texture.repeat.set(3, 3);
  if (kind === 'solar') texture.repeat.set(0.9, 0.9);
  return texture;
}

function createSkyTexture(mode: 'day' | 'night' = 'day'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  const random = seeded(7);

  if (mode === 'night') {
    gradient.addColorStop(0, '#081426');
    gradient.addColorStop(0.45, '#17304a');
    gradient.addColorStop(0.74, '#34465b');
    gradient.addColorStop(1, '#555044');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    const moon = ctx.createRadialGradient(770, 125, 6, 770, 125, 130);
    moon.addColorStop(0, 'rgba(232,240,255,0.95)');
    moon.addColorStop(0.16, 'rgba(185,205,235,0.45)');
    moon.addColorStop(1, 'rgba(150,180,220,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, 1024, 512);
    for (let index = 0; index < 150; index += 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + random() * 0.5})`;
      ctx.fillRect(random() * 1024, 20 + random() * 260, 1 + random() * 1.5, 1 + random() * 1.5);
    }
  } else {
    gradient.addColorStop(0, '#3f74a8');
    gradient.addColorStop(0.42, '#9ec4dd');
    gradient.addColorStop(0.68, '#e5eef1');
    gradient.addColorStop(1, '#f2ead8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    const sun = ctx.createRadialGradient(300, 185, 8, 300, 185, 190);
    sun.addColorStop(0, 'rgba(255,250,225,0.95)');
    sun.addColorStop(0.18, 'rgba(255,238,190,0.55)');
    sun.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1024, 512);
    for (let index = 0; index < 90; index += 1) {
      const x = random() * 1024;
      const y = 60 + random() * 210;
      const width = 30 + random() * 110;
      ctx.fillStyle = `rgba(255,255,255,${0.03 + random() * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(x, y, width, 4 + random() * 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
  gradient.addColorStop(0, 'rgba(22,30,24,0.5)');
  gradient.addColorStop(0.55, 'rgba(22,30,24,0.24)');
  gradient.addColorStop(1, 'rgba(22,30,24,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function paletteFor(plan: HousePlan): Palette {
  const tier = plan.finishTier;
  const style = plan.spec.style;
  const base: Record<HousePlan['finishTier'], Palette> = {
    standard: {
      wall: '#d8d0c1', trim: '#f3efe7', wood: '#b88a5b', stone: '#b7b0a4', roof: '#46505a',
      metal: '#a8adb0', glass: '#7d9db1', door: '#7a5238', accent: '#c8773f', ground: '#7d9a63',
    },
    elegant: {
      wall: '#e9e6df', trim: '#fbf9f3', wood: '#8b5a32', stone: '#c1bcb1', roof: '#333c43',
      metal: '#c4c3bb', glass: '#6389a2', door: '#5a3823', accent: '#b8894b', ground: '#71915a',
    },
    luxury: {
      wall: '#4a5155', trim: '#cbb27d', wood: '#5b3822', stone: '#9d9384', roof: '#20262b',
      metal: '#c8ad70', glass: '#3f6c85', door: '#34251b', accent: '#d0b26c', ground: '#668552',
    },
  };
  const palette = { ...base[tier] };
  if (style === 'Scandinavian') {
    palette.wall = tier === 'luxury' ? '#5a6264' : '#f1efe9';
    palette.wood = '#b9956c';
  }
  if (style === 'Classic') {
    palette.wall = tier === 'luxury' ? '#58534a' : '#efe5d2';
    palette.stone = '#c9bda8';
  }
  if (style === 'Tropical') {
    palette.wall = tier === 'luxury' ? '#565b50' : '#e5dcc8';
    palette.roof = '#4b4238';
  }
  if (style === 'Minimalist') {
    palette.wall = tier === 'luxury' ? '#404548' : '#ecece8';
    palette.wood = '#a69076';
  }
  if (plan.paletteShift) {
    (['wall', 'trim', 'stone', 'roof', 'ground'] as const).forEach((key) => {
      palette[key] = new THREE.Color(palette[key]).offsetHSL(0, 0, plan.paletteShift).getStyle();
    });
  }
  return palette;
}

function buildMaterials(plan: HousePlan, palette: Palette, seed: number): { materials: Materials; textures: THREE.CanvasTexture[] } {
  const textures: THREE.CanvasTexture[] = [
    createTexture('stucco', seed + 1),
    createTexture('wood', seed + 2),
    createTexture('stone', seed + 3),
    createTexture('roof', seed + 4),
    createTexture('grass', seed + 5),
    createTexture('concrete', seed + 6),
    createTexture('solar', seed + 7),
  ];
  const [stucco, woodMap, stoneMap, roofMap, grassMap, concreteMap, solarMap] = textures;
  const color = (value: string) => new THREE.Color(value);
  const materials: Materials = {
    wall: new THREE.MeshStandardMaterial({ color: color(palette.wall), map: stucco, bumpMap: stucco, bumpScale: 0.018, roughness: 0.88, metalness: 0.01 }),
    wallWarm: new THREE.MeshStandardMaterial({ color: color(palette.wall).offsetHSL(0, 0, 0.05), map: stucco, roughness: 0.9 }),
    trim: new THREE.MeshStandardMaterial({ color: color(palette.trim), roughness: 0.68, metalness: 0.03 }),
    wood: new THREE.MeshStandardMaterial({ color: color(palette.wood), map: woodMap, bumpMap: woodMap, bumpScale: 0.012, roughness: 0.62 }),
    stone: new THREE.MeshStandardMaterial({ color: color(palette.stone), map: stoneMap, bumpMap: stoneMap, bumpScale: 0.035, roughness: 0.93 }),
    roof: new THREE.MeshStandardMaterial({ color: color(palette.roof), map: roofMap, bumpMap: roofMap, bumpScale: 0.022, roughness: 0.76, metalness: 0.12, side: THREE.DoubleSide }),
    metal: new THREE.MeshStandardMaterial({ color: color(palette.metal), roughness: 0.32, metalness: 0.78 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: color(palette.glass), roughness: 0.04, metalness: 0.08, transmission: 0.45, thickness: 0.18,
      ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.9,
      transparent: true, opacity: 0.88, side: THREE.DoubleSide,
    }),
    darkGlass: new THREE.MeshPhysicalMaterial({
      color: color(palette.glass).multiplyScalar(0.55), roughness: 0.05, metalness: 0.22, transmission: 0.22,
      thickness: 0.14, clearcoat: 1, envMapIntensity: 2, transparent: true, opacity: 0.94, side: THREE.DoubleSide,
    }),
    door: new THREE.MeshStandardMaterial({ color: color(palette.door), map: woodMap, roughness: 0.5, metalness: 0.05 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xd2d0c8, map: concreteMap, bumpMap: concreteMap, bumpScale: 0.014, roughness: 0.92 }),
    ground: new THREE.MeshStandardMaterial({ color: color(palette.ground), map: grassMap, bumpMap: grassMap, bumpScale: 0.02, roughness: 1 }),
    solar: new THREE.MeshStandardMaterial({ color: 0xffffff, map: solarMap, roughness: 0.16, metalness: 0.42 }),
    foliage: [0x4f7b47, 0x628d52, 0x3f6c44, 0x79a05e].map(
      (value) => new THREE.MeshStandardMaterial({ color: value, roughness: 0.95, metalness: 0 }),
    ),
    trunk: new THREE.MeshStandardMaterial({ color: 0x6d4d33, roughness: 1 }),
    light: new THREE.MeshBasicMaterial({ color: 0xffe1a6 }),
    interiors: new THREE.MeshStandardMaterial({ color: 0x3d4448, roughness: 0.95, side: THREE.DoubleSide }),
  };
  return { materials, textures };
}

function faceTransform(face: ExteriorFace, volume: MassVolume, u: number, y: number, offset = 0): { position: THREE.Vector3; rotation: number } {
  if (face === 'front') return { position: new THREE.Vector3(volume.x + u, y, volume.z + volume.d / 2 + offset), rotation: 0 };
  if (face === 'back') return { position: new THREE.Vector3(volume.x + u, y, volume.z - volume.d / 2 - offset), rotation: 0 };
  if (face === 'right') return { position: new THREE.Vector3(volume.x + volume.w / 2 + offset, y, volume.z + u), rotation: Math.PI / 2 };
  return { position: new THREE.Vector3(volume.x - volume.w / 2 - offset, y, volume.z + u), rotation: Math.PI / 2 };
}

const House3DViewer = forwardRef<House3DViewerHandle, House3DViewerProps>(function House3DViewer(
  { spec, height = 420, seed = 0 },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<ViewerState | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');

  useImperativeHandle(ref, () => ({
    capture: (view, lighting) => stateRef.current?.capture(view, lighting) ?? null,
    setLighting: (lighting) => {
      stateRef.current?.setLighting(lighting);
      setLightingMode(lighting);
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const plan = buildHousePlan(spec, seed || 1);
    const palette = paletteFor(plan);
    const random = seeded((seed || 1) + 71);
    const { materials, textures } = buildMaterials(plan, palette, seed || 1);
    const shadowTexture = createShadowTexture();
    const daySkyTexture = createSkyTexture('day');
    const nightSkyTexture = createSkyTexture('night');

    const scene = new THREE.Scene();
    scene.background = daySkyTexture;
    scene.fog = new THREE.Fog(0xe4ecf0, 70, 180);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const dayEnvironment = pmrem.fromEquirectangular(daySkyTexture);
    const nightEnvironment = pmrem.fromEquirectangular(nightSkyTexture);
    scene.environment = dayEnvironment.texture;

    const hemi = new THREE.HemisphereLight(0xe9f3ff, 0x6d7c5a, 1.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff3dc, 3.1);
    sun.position.set(24, 34, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    const shadowSpan = Math.max(28, plan.width * 1.6);
    sun.shadow.camera.left = -shadowSpan;
    sun.shadow.camera.right = shadowSpan;
    sun.shadow.camera.top = shadowSpan;
    sun.shadow.camera.bottom = -shadowSpan;
    sun.shadow.camera.far = 140;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xa9c7e8, 0.5);
    fill.position.set(-18, 12, -16);
    scene.add(fill);

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 16);
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const house = new THREE.Group();
    scene.add(house);

    const nightLights: THREE.PointLight[] = [];
    const addNightLight = (x: number, y: number, z: number, intensity: number, distance: number) => {
      const light = new THREE.PointLight(0xffd7a0, 0, distance, 2);
      light.position.set(x, y, z);
      light.userData.intensity = intensity;
      house.add(light);
      nightLights.push(light);
    };

    const box = (
      w: number, h: number, d: number, x: number, y: number, z: number,
      material: THREE.Material, cast = true, rotationY = 0, receive = true,
    ) => {
      const mesh = new THREE.Mesh(boxGeometry, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotationY;
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      house.add(mesh);
      return mesh;
    };

    const cylinder = (
      radius: number, h: number, x: number, y: number, z: number,
      material: THREE.Material, rotationX = 0, rotationZ = 0,
    ) => {
      const mesh = new THREE.Mesh(cylinderGeometry, material);
      mesh.scale.set(radius, h, radius);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rotationX, 0, rotationZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      house.add(mesh);
      return mesh;
    };

    const panel = (
      face: ExteriorFace, volume: MassVolume, u: number, y: number,
      w: number, h: number, thickness: number, material: THREE.Material, offset: number,
    ) => {
      const transform = faceTransform(face, volume, u, y, offset);
      const widthAxis = face === 'front' || face === 'back' ? w : thickness;
      const depthAxis = face === 'front' || face === 'back' ? thickness : w;
      const mesh = box(widthAxis, h, depthAxis, transform.position.x, transform.position.y, transform.position.z, material, false);
      return mesh;
    };

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), materials.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene.add(ground);

    const contact = new THREE.Mesh(
      planeGeometry,
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.72, depthWrite: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.set(0, 0.012, 0);
    contact.scale.set(plan.width * 1.5, plan.depth * 1.7, 1);
    house.add(contact);

    const openings = new Map<MassVolume, Record<ExteriorFace, Opening[]>>();
    const addOpening = (volume: MassVolume, face: ExteriorFace, opening: Opening) => {
      const record = openings.get(volume) ?? { front: [], back: [], left: [], right: [] };
      record[face].push(opening);
      openings.set(volume, record);
    };

    const volumeForRoom = (room: Room, floor: number): MassVolume =>
      plan.volumes.find((volume) => Math.abs(volume.base - floor * plan.floorHeight) < 0.01
        && Math.abs(room.x - volume.x) <= volume.w / 2 + 0.01
        && Math.abs(room.z - volume.z) <= volume.d / 2 + 0.01) ?? plan.volumes[0];

    interface WindowSpec {
      volume: MassVolume;
      face: ExteriorFace;
      room: Room;
      floor: number;
      u: number;
      width: number;
      bottom: number;
      top: number;
      fullHeight: boolean;
    }

    const main = plan.volumes[0];
    const entryX = THREE.MathUtils.clamp(plan.entryX, -main.w / 2 + 1.2, main.w / 2 - 1.2);
    const walkway = new THREE.Mesh(planeGeometry, materials.concrete);
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.set(entryX, 0.008, plan.depth / 2 + 2.4);
    walkway.scale.set(2.4, 4.6, 1);
    walkway.receiveShadow = true;
    scene.add(walkway);
    if (plan.spec.features.includes('Carport')) {
      const driveSide = entryX > 0 ? 1 : -1;
      const driveway = new THREE.Mesh(planeGeometry, materials.concrete);
      driveway.rotation.x = -Math.PI / 2;
      driveway.position.set(driveSide * (main.w / 2 - 1.4), 0.006, plan.depth / 2 + 4.3);
      driveway.scale.set(4.2, 5.6, 1);
      driveway.receiveShadow = true;
      scene.add(driveway);
    }
    const doorHeight = plan.spec.features.includes('High ceiling') ? 2.6 : 2.3;
    addOpening(main, 'front', { u: entryX - main.x, width: 1.55, bottom: 0, top: doorHeight + 0.1, kind: 'door' });

    const windowSpecs: WindowSpec[] = [];
    plan.floorRooms.forEach((rooms, floor) => {
      rooms.forEach((room) => {
        if (room.kind === 'hall') return;
        const volume = volumeForRoom(room, floor);
        const span = room.face === 'front' || room.face === 'back' ? room.w : room.d;
        const maxWidth = room.kind === 'bathroom'
          ? 0.85
          : Math.min(span * plan.glazing, plan.finishTier === 'luxury' ? 4.4 : 2.8);
        const width = Math.max(0.72, maxWidth);
        const u = room.face === 'front' || room.face === 'back'
          ? THREE.MathUtils.clamp(room.x - volume.x, -volume.w / 2 + width / 2 + 0.3, volume.w / 2 - width / 2 - 0.3)
          : THREE.MathUtils.clamp(room.z - volume.z, -volume.d / 2 + width / 2 + 0.3, volume.d / 2 - width / 2 - 0.3);
        const fullHeight = plan.finishTier === 'luxury' && (room.kind === 'living' || room.kind === 'dining' || room.kind === 'office');
        const windowHeight = fullHeight ? plan.floorHeight - 0.42 : plan.spec.features.includes('High ceiling') ? 1.85 : 1.42;
        const bottom = floor * plan.floorHeight + (fullHeight ? 0.18 : 0.78);
        windowSpecs.push({ volume, face: room.face, room, floor, u, width, bottom, top: bottom + windowHeight, fullHeight });
        addOpening(volume, room.face, { u, width, bottom, top: bottom + windowHeight, kind: 'window' });
        if (plan.spec.features.includes('High ceiling') && !fullHeight) {
          addOpening(volume, room.face, {
            u, width, bottom: bottom + windowHeight + 0.06, top: bottom + windowHeight + 0.36, kind: 'window',
          });
        }
      });
    });

    const addWindow = (spec: WindowSpec) => {
      const { volume, face, u, width, bottom, top, fullHeight } = spec;
      const centerY = (bottom + top) / 2;
      const windowHeight = top - bottom;
      panel(face, volume, u, centerY, width + 0.16, windowHeight + 0.18, 0.06, materials.trim, 0.075);
      panel(face, volume, u, centerY, width - 0.06, windowHeight - 0.06, 0.07, spec.room.kind === 'bathroom' ? materials.darkGlass : materials.glass, 0.14);
      const mullions = fullHeight ? 3 : plan.facadeVariant === 0 ? 1 : plan.facadeVariant === 1 ? 2 : 3;
      for (let index = 1; index < mullions; index += 1) {
        const offset = -width / 2 + (width * index) / mullions;
        panel(face, volume, u + offset, centerY, 0.045, windowHeight, 0.09, materials.metal, 0.17);
      }
      panel(face, volume, u, centerY + windowHeight * 0.28, width, 0.045, 0.09, materials.metal, 0.17);
      panel(face, volume, u, bottom - 0.11, width + 0.32, 0.1, 0.26, materials.stone, 0.13);
      if (plan.spec.features.includes('High ceiling') && !fullHeight) {
        panel(face, volume, u, top + 0.21, width, 0.28, 0.07, materials.darkGlass, 0.13);
      }
    };

    const addDoor = () => {
      const x = entryX;
      panel('front', main, x - main.x, doorHeight / 2, 1.55, doorHeight + 0.1, 0.1, materials.trim, 0.09);
      panel('front', main, x - main.x, doorHeight / 2, 1.32, doorHeight, 0.12, materials.door, 0.14);
      panel('front', main, x - main.x + 0.28, doorHeight / 2, 0.03, doorHeight - 0.16, 0.14, materials.metal, 0.19);
      const knob = new THREE.Mesh(sphereGeometry, materials.metal);
      knob.scale.setScalar(0.07);
      knob.position.set(x + 0.46, 1.05, main.z + main.d / 2 + 0.24);
      house.add(knob);
      const stepCount = plan.finishTier === 'luxury' ? 3 : 2;
      for (let index = 0; index < stepCount; index += 1) {
        box(2.5 + index * 0.4, 0.14, 0.5 + index * 0.35, x, 0.07 + index * 0.03, main.z + main.d / 2 + 0.55 + index * 0.32, materials.concrete);
      }
      if (plan.finishTier === 'standard') {
        box(0.42, 0.14, 0.12, x, doorHeight + 0.3, main.z + main.d / 2 + 0.12, materials.light, false);
      }
      if (plan.finishTier !== 'standard') {
        const canopyWidth = plan.finishTier === 'luxury' ? 4.4 : 3.2;
        box(canopyWidth, 0.18, 1.8, x, doorHeight + 0.55, main.z + main.d / 2 + 0.8, materials.roof);
        for (const side of [-1, 1]) {
          cylinder(0.045, doorHeight + 0.45, x + side * (canopyWidth / 2 - 0.16), (doorHeight + 0.45) / 2, main.z + main.d / 2 + 1.5, materials.metal);
        }
      }
      return x;
    };

    const addFaceWall = (volume: MassVolume, face: ExteriorFace, wallMaterial: THREE.Material) => {
      const isFrontBack = face === 'front' || face === 'back';
      const span = isFrontBack ? volume.w : volume.d;
      const start = -span / 2;
      const end = span / 2;
      const bottom = volume.base;
      const top = volume.base + volume.h;
      const sorted = [...(openings.get(volume)?.[face] ?? [])].sort((a, b) => a.u - b.u);
      const outward = face === 'front' || face === 'right' ? 1 : -1;

      const segment = (u0: number, u1: number, y0: number, y1: number, material: THREE.Material, offset: number) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.04) return;
        const thickness = 0.18;
        const centerU = (u0 + u1) / 2;
        const centerY = (y0 + y1) / 2;
        if (isFrontBack) {
          box(u1 - u0, y1 - y0, thickness, volume.x + centerU, centerY, volume.z + (face === 'front' ? volume.d / 2 : -volume.d / 2) + outward * offset, material);
        } else {
          box(thickness, y1 - y0, u1 - u0, volume.x + (face === 'right' ? volume.w / 2 : -volume.w / 2) + outward * offset, centerY, volume.z + centerU, material);
        }
      };

      let cursor = start;
      sorted.forEach((opening) => {
        const left = opening.u - opening.width / 2;
        const right = opening.u + opening.width / 2;
        if (left > cursor) segment(cursor, left, bottom, top, wallMaterial, 0);
        segment(left, right, bottom, opening.bottom, wallMaterial, 0);
        segment(left, right, opening.top, top, wallMaterial, 0);
        if (plan.finishTier === 'luxury' && opening.bottom > bottom + 1.2) {
          segment(left, right, bottom, Math.min(top, 1.15), materials.stone, 0.06);
        }
        cursor = Math.max(cursor, right);
      });
      if (cursor < end) segment(cursor, end, bottom, top, wallMaterial, 0);
      if (plan.finishTier === 'luxury') {
        let stoneCursor = start;
        sorted.forEach((opening) => {
          const left = opening.u - opening.width / 2;
          const right = opening.u + opening.width / 2;
          if (left > stoneCursor) segment(stoneCursor, left, bottom, Math.min(top, 1.15), materials.stone, 0.06);
          stoneCursor = Math.max(stoneCursor, right);
        });
        if (stoneCursor < end) segment(stoneCursor, end, bottom, Math.min(top, 1.15), materials.stone, 0.06);
        segment(start, end, 1.13, 1.22, materials.metal, 0.08);
      }
    };

    const addVolumeShell = (volume: MassVolume) => {
      const wallMaterial = volume.role === 'wing' ? materials.wallWarm : materials.wall;
      (['front', 'back', 'left', 'right'] as ExteriorFace[]).forEach((face) => addFaceWall(volume, face, wallMaterial));
      box(volume.w - 0.36, 0.14, volume.d - 0.36, volume.x, volume.base + 0.07, volume.z, materials.concrete, false);
      box(volume.w - 0.36, 0.12, volume.d - 0.36, volume.x, volume.base + volume.h - 0.1, volume.z, materials.trim, false);
      box(volume.w + 0.16, 0.16, volume.d + 0.16, volume.x, volume.base + 0.08, volume.z, materials.trim);
      box(volume.w + 0.12, 0.12, volume.d + 0.12, volume.x, volume.base + volume.h - 0.06, volume.z, materials.trim);
      for (const cornerX of [-1, 1]) {
        for (const cornerZ of [-1, 1]) {
          box(0.16, volume.h, 0.16, volume.x + cornerX * volume.w / 2, volume.base + volume.h / 2, volume.z + cornerZ * volume.d / 2, materials.trim);
        }
      }

      const style = plan.spec.style;
      if (style === 'Classic') {
        for (const side of [-1, 1]) {
          box(0.34, volume.h * 0.92, 0.34, volume.x + side * (volume.w / 2 - 0.25), volume.base + volume.h * 0.46, volume.z + volume.d / 2 + 0.1, materials.stone);
        }
        box(volume.w + 0.5, 0.26, volume.d + 0.5, volume.x, volume.base + volume.h - 0.32, volume.z, materials.trim);
      }
      if (style === 'Scandinavian' || style === 'Tropical') {
        const count = Math.max(4, Math.floor(volume.w / 0.9));
        const frontOpenings = openings.get(volume)?.front ?? [];
        for (let index = 0; index < count; index += 1) {
          const u = -volume.w / 2 + 0.4 + (index * (volume.w - 0.8)) / Math.max(1, count - 1);
          if (frontOpenings.some((opening) => Math.abs(u - opening.u) < opening.width / 2 + 0.18)) continue;
          box(0.07, volume.h * 0.94, 0.1, volume.x + u, volume.base + volume.h / 2, volume.z + volume.d / 2 + 0.07, materials.wood, false);
        }
      }
      if (style === 'Modern' || style === 'Minimalist') {
        box(volume.w + 0.22, 0.1, volume.d + 0.22, volume.x, volume.base + volume.h * 0.58, volume.z, materials.metal, false);
      }
      if (plan.finishTier === 'elegant') {
        const frontOpenings = openings.get(volume)?.front ?? [];
        const count = Math.max(5, Math.floor(volume.w / 0.85) + plan.facadeVariant);
        for (let index = 0; index < count; index += 1) {
          const u = -volume.w / 2 + 0.45 + (index * (volume.w - 0.9)) / Math.max(1, count - 1);
          if (frontOpenings.some((opening) => Math.abs(u - opening.u) < opening.width / 2 + 0.12)) continue;
          box(0.075, volume.h * 0.82, 0.1, volume.x + u, volume.base + volume.h / 2, volume.z + volume.d / 2 + 0.085, materials.wood, false);
        }
        box(volume.w + 0.18, 0.09, volume.d + 0.18, volume.x, volume.base + volume.h * 0.34, volume.z, materials.wood, false);
      }
      if (plan.finishTier === 'luxury') {
        const frontOpenings = openings.get(volume)?.front ?? [];
        const finCount = 5 + plan.facadeVariant;
        for (let index = 0; index < finCount; index += 1) {
          const u = -volume.w * 0.42 + (index * volume.w * 0.84) / (finCount - 1);
          if (frontOpenings.some((opening) => Math.abs(u - opening.u) < opening.width / 2 + 0.12)) continue;
          box(0.055, volume.h * 0.9, 0.09, volume.x + u, volume.base + volume.h / 2, volume.z + volume.d / 2 + 0.09, materials.metal, false);
        }
        box(volume.w + 0.24, 0.08, volume.d + 0.24, volume.x, volume.base + volume.h * 0.66, volume.z, materials.metal, false);
      }
    };

    const addPartitions = () => {
      const partitionMaterial = materials.wallWarm;
      plan.floorRooms.forEach((rooms, floor) => {
        const base = floor * plan.floorHeight + 0.12;
        const wallHeight = plan.floorHeight - 0.22;
        rooms.forEach((room, index) => {
          const right = room.x + room.w / 2;
          const left = room.x - room.w / 2;
          const front = room.z + room.d / 2;
          const back = room.z - room.d / 2;
          const neighborRight = rooms.some((other, otherIndex) => otherIndex !== index && Math.abs(other.x - other.w / 2 - right) < 0.12 && Math.abs(other.z - room.z) < 0.12);
          const neighborFront = rooms.some((other, otherIndex) => otherIndex !== index && Math.abs(other.z - other.d / 2 - front) < 0.12 && Math.abs(other.x - room.x) < 0.12);
          if (neighborRight) {
            const gap = 0.9;
            const segment = (room.d - gap) / 2;
            if (segment > 0.1) {
              box(0.1, wallHeight, segment, right, base + wallHeight / 2, back + segment / 2, partitionMaterial, false);
              box(0.1, wallHeight, segment, right, base + wallHeight / 2, front - segment / 2, partitionMaterial, false);
            }
          }
          if (neighborFront) {
            const gap = 0.9;
            const segment = (room.w - gap) / 2;
            if (segment > 0.1) {
              box(segment, wallHeight, 0.1, left + segment / 2, base + wallHeight / 2, front, partitionMaterial, false);
              box(segment, wallHeight, 0.1, right - segment / 2, base + wallHeight / 2, front, partitionMaterial, false);
            }
          }
          const lamp = new THREE.Mesh(planeGeometry, materials.light);
          lamp.rotation.x = Math.PI / 2;
          lamp.scale.setScalar(0.42);
          lamp.position.set(room.x, base + wallHeight - 0.02, room.z);
          house.add(lamp);
        });
      });
    };

    const addRoof = (volume: MassVolume) => {
      const top = volume.base + volume.h;
      const overhang = plan.overhang;
      const halfW = volume.w / 2 + overhang;
      const halfD = volume.d / 2 + overhang;

      if (plan.flatRoof) {
        box(volume.w + overhang * 2, 0.24, volume.d + overhang * 2, volume.x, top + 0.12, volume.z, materials.roof);
        const parapet = plan.spec.style === 'Minimalist' ? 0.28 : 0.48;
        for (const side of [-1, 1]) {
          box(volume.w + overhang * 2, parapet, 0.18, volume.x, top + parapet / 2 + 0.18, volume.z + side * halfD, materials.wall);
          box(0.18, parapet, volume.d + overhang * 2, volume.x + side * halfW, top + parapet / 2 + 0.18, volume.z, materials.wall);
          box(volume.w + overhang * 2 + 0.12, 0.08, 0.28, volume.x, top + parapet + 0.2, volume.z + side * halfD, materials.trim);
          box(0.28, 0.08, volume.d + overhang * 2 + 0.12, volume.x + side * halfW, top + parapet + 0.2, volume.z, materials.trim);
        }
        if (plan.finishTier !== 'standard') {
          box(volume.w + overhang * 2, 0.035, 0.05, volume.x, top + 0.26, volume.z + halfD - 0.12, materials.light, false);
        }
        return;
      }

      const rise = plan.roofRise;
      const x0 = volume.x - halfW;
      const x1 = volume.x + halfW;
      const y0 = top;
      const z0 = volume.z - halfD;
      const z1 = volume.z + halfD;
      const ridgeHalf = plan.spec.style === 'Tropical' ? volume.d * 0.2 : 0;
      const positions: number[] = [];
      const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
      const quad = (a: number[], b: number[], c: number[], d: number[]) => {
        triangle(a, b, c);
        triangle(a, c, d);
      };

      if (plan.spec.style === 'Tropical') {
        quad([x0, y0, z1], [volume.x, y0 + rise, z1 - ridgeHalf], [volume.x, y0 + rise, z0 + ridgeHalf], [x0, y0, z0]);
        quad([volume.x, y0 + rise, z1 - ridgeHalf], [x1, y0, z1], [x1, y0, z0], [volume.x, y0 + rise, z0 + ridgeHalf]);
        triangle([x1, y0, z1], [volume.x, y0 + rise, z1 - ridgeHalf], [x0, y0, z1]);
        triangle([x0, y0, z0], [volume.x, y0 + rise, z0 + ridgeHalf], [x1, y0, z0]);
        box(0.22, 0.2, ridgeHalf * 2 + 0.6, volume.x, y0 + rise + 0.05, volume.z, materials.roof);
      } else {
        quad([x0, y0, z1], [volume.x, y0 + rise, z1], [volume.x, y0 + rise, z0], [x0, y0, z0]);
        quad([volume.x, y0 + rise, z1], [x1, y0, z1], [x1, y0, z0], [volume.x, y0 + rise, z0]);
        triangle([x1, y0, z1], [volume.x, y0 + rise, z1], [x0, y0, z1]);
        triangle([x0, y0, z0], [volume.x, y0 + rise, z0], [x1, y0, z0]);
        box(0.24, 0.2, volume.d + overhang * 2 + 0.3, volume.x, y0 + rise + 0.04, volume.z, materials.roof);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      const slopes = new THREE.Mesh(geometry, materials.roof);
      slopes.castShadow = true;
      slopes.receiveShadow = true;
      house.add(slopes);

      for (const side of [-1, 1]) {
        box(0.14, 0.18, volume.d + overhang * 2, volume.x + side * halfW, y0 + 0.04, volume.z, materials.metal, false);
        cylinder(0.075, y0, volume.x + side * (halfW - 0.12), y0 / 2, z1 - 0.12, materials.metal);
      }
      if (plan.spec.style === 'Tropical') {
        for (let index = 0; index < 12; index += 1) {
          const x = x0 + (index * (x1 - x0)) / 11;
          box(0.09, 0.12, 0.32, x, y0 - 0.08, z1 + 0.05, materials.wood, false);
        }
      }
    };

    const addLandscaping = () => {
      const tierIndex = plan.finishTier === 'luxury' ? 2 : plan.finishTier === 'elegant' ? 1 : 0;
      const lush = plan.spec.features.includes('Landscaping') || plan.spec.style === 'Tropical' || plan.finishTier === 'luxury';
      const treeCount = tierIndex + (lush ? 3 : 0) + 1;
      const positions: [number, number][] = [
        [-plan.width / 2 - 2.3, plan.depth / 2 + 2.2],
        [plan.width / 2 + 2.6, -plan.depth / 2 - 2.4],
        [-plan.width / 2 - 3.4, -plan.depth / 2 - 3],
        [plan.width / 2 + 3.2, plan.depth / 2 + 3.1],
        [-plan.width * 0.2, plan.depth / 2 + 5.2],
      ];
      for (let index = 0; index < Math.min(treeCount, positions.length); index += 1) {
        const [x, z] = positions[index];
        const treeHeight = 2.6 + random() * 1.5;
        cylinder(0.11 + random() * 0.05, treeHeight, x, treeHeight / 2, z, materials.trunk);
        const clusters = plan.finishTier === 'standard' ? 3 : 5;
        for (let cluster = 0; cluster < clusters; cluster += 1) {
          const leaf = new THREE.Mesh(sphereGeometry, materials.foliage[(index + cluster) % materials.foliage.length]);
          const radius = 0.65 + random() * 0.6;
          leaf.scale.set(radius, radius * (0.85 + random() * 0.4), radius);
          leaf.position.set(
            x + (random() - 0.5) * 1.5,
            treeHeight + (random() - 0.3) * 0.9,
            z + (random() - 0.5) * 1.5,
          );
          leaf.castShadow = true;
          leaf.receiveShadow = true;
          house.add(leaf);
        }
      }

      const shrubCount = 5 + tierIndex * 5 + (lush ? 6 : 0);
      for (let index = 0; index < shrubCount; index += 1) {
        const side = index % 2 === 0 ? 1 : -1;
        const x = side * (plan.width / 2 + 0.85 + random() * 2.4);
        const z = -plan.depth / 2 + random() * plan.depth;
        const leaf = new THREE.Mesh(sphereGeometry, materials.foliage[index % materials.foliage.length]);
        const radius = 0.32 + random() * 0.45;
        leaf.scale.set(radius, radius * 0.85, radius);
        leaf.position.set(x, radius * 0.75, z);
        leaf.castShadow = true;
        house.add(leaf);
      }

      if (tierIndex > 0) {
        const bedWidth = Math.min(4.5, plan.width * 0.32);
        const bedX = -plan.width * 0.28;
        const bedZ = plan.depth / 2 + 2.6;
        box(bedWidth, 0.14, 1.35, bedX, 0.07, bedZ, materials.stone, false);
        for (let index = 0; index < 7; index += 1) {
          const leaf = new THREE.Mesh(sphereGeometry, materials.foliage[index % materials.foliage.length]);
          const radius = 0.18 + random() * 0.2;
          leaf.scale.set(radius, radius * 1.3, radius);
          leaf.position.set(bedX - bedWidth / 2 + 0.4 + (index * (bedWidth - 0.8)) / 6, 0.35, bedZ + (random() - 0.5) * 0.6);
          house.add(leaf);
        }
      }

      if (plan.finishTier === 'luxury') {
        const poolWidth = Math.min(5.5, plan.width * 0.4);
        const poolX = plan.width * 0.3;
        const poolZ = plan.depth / 2 + 4;
        box(poolWidth + 0.5, 0.16, 2.4 + 0.5, poolX, 0.08, poolZ, materials.stone, false);
        const water = new THREE.Mesh(
          planeGeometry,
          new THREE.MeshPhysicalMaterial({ color: 0x4f97b2, roughness: 0.06, metalness: 0.1, transmission: 0.35, thickness: 0.2, transparent: true, opacity: 0.9 }),
        );
        water.rotation.x = -Math.PI / 2;
        water.position.set(poolX, 0.18, poolZ);
        water.scale.set(poolWidth, 2.4, 1);
        house.add(water);
      }

      if (plan.spec.features.includes('Landscaping') || tierIndex > 0) {
        const lightCount = 4 + tierIndex * 2;
        for (let index = 0; index < lightCount; index += 1) {
          const t = (index + 1) / (lightCount + 1);
          const x = -plan.width * 0.4 + t * plan.width * 0.8;
          const z = plan.depth / 2 + 1.2;
          cylinder(0.05, 0.42, x, 0.21, z, materials.metal);
          const glow = new THREE.Mesh(sphereGeometry, materials.light);
          glow.scale.setScalar(0.09);
          glow.position.set(x, 0.46, z);
          house.add(glow);
        }
      }
    };

    plan.volumes.forEach((volume) => addVolumeShell(volume));
    addPartitions();

    plan.volumes.forEach((volume) => addRoof(volume));

    addDoor();
    windowSpecs.forEach((spec) => addWindow(spec));

    if (plan.spec.features.includes('Balcony') && plan.floors > 1) {
      const floor = plan.floors > 2 ? 2 : 1;
      const upper = plan.volumes.find((volume) => Math.abs(volume.base - floor * plan.floorHeight) < 0.01) ?? main;
      const balconyWidth = Math.min(upper.w * 0.62, 7);
      const balconyY = upper.base - 0.02;
      const balconyX = upper.x + (plan.massingVariant - 1) * upper.w * 0.12;
      const frontZ = upper.z + upper.d / 2;
      box(balconyWidth, 0.18, 1.35, balconyX, balconyY, frontZ + 0.68, materials.concrete);
      const railMaterial = plan.finishTier === 'standard' ? materials.metal : materials.glass;
      if (plan.finishTier === 'standard') {
        box(balconyWidth, 0.06, 0.06, balconyX, balconyY + 1.05, frontZ + 1.32, materials.metal);
        for (let index = 0; index <= 10; index += 1) {
          const x = balconyX - balconyWidth / 2 + (index * balconyWidth) / 10;
          box(0.045, 1, 0.045, x, balconyY + 0.55, frontZ + 1.32, materials.metal, false);
        }
      } else {
        box(balconyWidth, 0.85, 0.045, balconyX, balconyY + 0.52, frontZ + 1.32, railMaterial, false);
        box(balconyWidth, 0.08, 0.08, balconyX, balconyY + 0.98, frontZ + 1.32, materials.metal, false);
      }
      for (const side of [-1, 1]) {
        box(0.07, 1, 0.07, balconyX + side * balconyWidth / 2, balconyY + 0.5, frontZ + 1.32, materials.metal, false);
      }
    }

    if (plan.spec.features.includes('Carport')) {
      const carportWidth = 3.6;
      const carportDepth = 2.9;
      const side = entryX > 0 ? 1 : -1;
      const x = side * (main.w / 2 - carportWidth * 0.35);
      const z = main.z + main.d / 2 + carportDepth / 2 + 0.7;
      box(carportWidth + 0.5, 2.75, carportDepth + 0.5, x, 0.14, z, materials.concrete, false);
      box(carportWidth + 0.6, 0.18, carportDepth + 0.6, x, 2.7, z, materials.roof);
      box(carportWidth + 0.75, 0.1, carportDepth + 0.75, x, 2.58, z, materials.metal);
      for (const postX of [x - carportWidth / 2, x + carportWidth / 2]) {
        cylinder(0.09, 2.62, postX, 1.31, z + carportDepth / 2, materials.metal);
        box(0.28, 0.1, 0.28, postX, 0.06, z + carportDepth / 2, materials.concrete, false);
      }
      for (let index = 0; index < 4; index += 1) {
        box(carportWidth + 0.4, 0.012, 0.05, x, 0.22, z - carportDepth / 2 + 0.4 + index * 0.65, materials.trim, false, 0, false);
      }
    }

    if (plan.spec.features.includes('Solar-ready')) {
      const roofVolume = plan.volumes.reduce((best, volume) => (
        volume.base + volume.h > best.base + best.h ? volume : best
      ), plan.volumes[0]);
      const roofTop = roofVolume.base + roofVolume.h;
      const halfW = roofVolume.w / 2;
      const halfD = roofVolume.d / 2;
      const panelWidth = 1.45;
      const panelDepth = 2.1;
      const positions: { x: number; y: number; z: number; rotX: number; rotZ: number }[] = [];

      if (plan.flatRoof) {
        const columns = THREE.MathUtils.clamp(Math.floor((roofVolume.w - 1.2) / (panelWidth + 0.42)), 1, 5);
        const rows = THREE.MathUtils.clamp(Math.floor((roofVolume.d - 1.2) / (panelDepth + 0.5)), 1, 4);
        const stepX = columns > 1 ? Math.max(0, roofVolume.w - panelWidth - 0.8) / (columns - 1) : 0;
        const stepZ = rows > 1 ? Math.max(0, roofVolume.d - panelDepth - 0.8) / (rows - 1) : 0;
        for (let column = 0; column < columns; column += 1) {
          for (let row = 0; row < rows; row += 1) {
            positions.push({
              x: roofVolume.x - stepX * (columns - 1) / 2 + column * stepX + (plan.facadeVariant - 1) * 0.16,
              y: roofTop + 0.9,
              z: roofVolume.z - stepZ * (rows - 1) / 2 + row * stepZ,
              rotX: -0.18,
              rotZ: 0,
            });
          }
        }
      } else {
        const pitch = Math.atan2(plan.roofRise, halfW);
        const side = plan.facadeVariant === 0 ? -1 : 1;
        const columns = THREE.MathUtils.clamp(Math.floor((halfW - 0.9) / (panelWidth + 0.3)), 1, 2);
        const rows = THREE.MathUtils.clamp(Math.floor((roofVolume.d * 0.42) / (panelDepth + 0.4)), 1, 3);
        const stepZ = rows > 1 ? Math.min(halfD * 0.76, (rows - 1) * (panelDepth + 0.55)) / (rows - 1) : 0;
        for (let column = 0; column < columns; column += 1) {
          const inset = panelWidth / 2 + 0.4 + column * (panelWidth + 0.3);
          const slopeX = side * Math.max(0, halfW - inset);
          const surfaceY = roofTop + plan.roofRise * (1 - Math.abs(slopeX) / halfW);
          for (let row = 0; row < rows; row += 1) {
            positions.push({
              x: roofVolume.x + slopeX,
              y: surfaceY + 0.16,
              z: roofVolume.z - stepZ * (rows - 1) / 2 + row * stepZ,
              rotX: 0,
              rotZ: -side * pitch,
            });
          }
        }
      }

      positions.forEach((position) => {
        const panel = box(panelWidth, 0.06, panelDepth, position.x, position.y, position.z, materials.solar, false);
        panel.rotation.set(position.rotX, 0, position.rotZ);
        for (const railZ of [-1, 1]) {
          const rail = box(
            panelWidth + 0.08, 0.05, 0.05,
            position.x, position.y - 0.07, position.z + railZ * panelDepth * 0.3,
            materials.metal, false,
          );
          rail.rotation.set(position.rotX, 0, position.rotZ);
        }
        for (const cornerX of [-1, 1]) {
          for (const cornerZ of [-1, 1]) {
            const post = box(
              0.05, 0.3, 0.05,
              position.x + cornerX * panelWidth * 0.36,
              position.y - 0.2,
              position.z + cornerZ * panelDepth * 0.32,
              materials.metal, false,
            );
            post.rotation.set(position.rotX, 0, position.rotZ);
          }
        }
      });
    }

    if (plan.spec.features.includes('Home office')) {
      const office = plan.floorRooms[0]?.find((room) => room.kind === 'office');
      if (office) {
        const deskX = office.x;
        const deskZ = office.z;
        box(1.55, 0.07, 0.72, deskX, 0.82, deskZ, materials.wood, false);
        for (const side of [-1, 1]) {
          box(0.07, 0.78, 0.65, deskX + side * 0.7, 0.39, deskZ, materials.metal, false);
        }
        box(0.62, 0.4, 0.05, deskX, 1.15, deskZ - 0.25, materials.darkGlass, false);
        box(0.28, 0.02, 0.2, deskX, 0.87, deskZ - 0.24, materials.metal, false);
      }
    }

    addLandscaping();

    if (plan.finishTier !== 'standard') {
      const sconceCount = plan.finishTier === 'luxury' ? 4 : 2;
      for (let index = 0; index < sconceCount; index += 1) {
        const x = main.x - main.w * 0.36 + (index * main.w * 0.72) / Math.max(1, sconceCount - 1);
        const z = main.z + main.d / 2 + 0.17;
        box(0.18, 0.42, 0.1, x, 2.25, z, materials.metal, false);
        const glow = new THREE.Mesh(sphereGeometry, materials.light);
        glow.scale.setScalar(0.09);
        glow.position.set(x, 2.25, z + 0.08);
        house.add(glow);
        if (plan.finishTier === 'luxury') {
          const light = new THREE.PointLight(0xffdca8, 5, 5, 2);
          light.position.set(x, 2.1, z + 0.45);
          house.add(light);
        }
      }
    }

    addNightLight(entryX, 2.4, main.z + main.d / 2 + 1.2, 6, 9);
    for (const side of [-1, 1]) {
      addNightLight(main.x + side * main.w * 0.38, 1.9, main.z + main.d / 2 + 1.1, 3.5, 7);
    }
    addNightLight(0, Math.max(2.5, plan.height * 0.55), main.z + main.d / 2 + 4, 2.5, 13);

    const extent = plan.volumes.reduce((maximum, volume) => Math.max(
      maximum,
      Math.abs(volume.x) + volume.w / 2,
      Math.abs(volume.z) + volume.d / 2,
    ), 0);
    const target = new THREE.Vector3(0, plan.height * 0.44, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = Math.max(8, extent * 0.8);
    controls.maxDistance = Math.max(45, extent * 5.5);
    controls.maxPolarAngle = Math.PI / 2.04;
    controls.minPolarAngle = 0.18;
    controls.enablePan = true;

    const radius = Math.max(20, extent * 2.15);
    const applyPreset = (preset: 'front' | 'corner' | 'aerial') => {
      if (preset === 'front') camera.position.set(0, target.y + plan.height * 0.12, radius);
      else if (preset === 'aerial') camera.position.set(radius * 0.35, radius * 0.82, radius * 0.5);
      else camera.position.set(radius * 0.72, target.y + radius * 0.36, radius * 0.72);
      controls.target.copy(target);
      controls.update();
    };
    applyPreset('corner');

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.output = GTAOPass.OUTPUT.Default;
    ao.blendIntensity = 1.15;
    ao.updateGtaoMaterial({ radius: 0.12, distanceExponent: 1.6, thickness: 0.8, samples: 10, screenSpaceRadius: false });
    ao.updatePdMaterial({ rings: 2, samples: 10, radius: 6 });
    composer.addPass(ao);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.6, 0.82);
    bloomPass.enabled = false;
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    const resize = () => {
      const width = mount.clientWidth || 640;
      const nextHeight = mount.clientHeight || height;
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(width, nextHeight, false);
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, nextHeight);
      camera.aspect = width / nextHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const baseLighting = {
      hemi: hemi.intensity,
      sun: sun.intensity,
      fill: fill.intensity,
      exposure: renderer.toneMappingExposure,
    };
    let currentLighting: LightingMode = 'day';

    const setLighting = (mode: LightingMode) => {
      currentLighting = mode;
      scene.background = mode === 'night' ? nightSkyTexture : daySkyTexture;
      scene.environment = mode === 'night' ? nightEnvironment.texture : dayEnvironment.texture;
      scene.fog = new THREE.Fog(mode === 'night' ? 0x223146 : 0xe4ecf0, 70, 180);
      bloomPass.enabled = mode === 'night';
      hemi.intensity = mode === 'night' ? 0.42 : baseLighting.hemi;
      sun.intensity = mode === 'night' ? 0.22 : baseLighting.sun;
      fill.intensity = mode === 'night' ? 0.24 : baseLighting.fill;
      renderer.toneMappingExposure = mode === 'night' ? 1.36 : baseLighting.exposure;
      nightLights.forEach((light) => {
        light.intensity = mode === 'night' ? Number(light.userData.intensity) : 0;
      });
    };

    const capture = (view: RenderView, mode: LightingMode): string | null => {
      const previousLighting = currentLighting;
      const previousPosition = camera.position.clone();
      const previousTarget = controls.target.clone();
      const previousSize = new THREE.Vector2();
      renderer.getSize(previousSize);
      const previousPixelRatio = renderer.getPixelRatio();
      let image: string | null = null;

      try {
        setLighting(mode);
        applyPreset(view);
        renderer.setPixelRatio(1);
        renderer.setSize(1920, 1200, false);
        composer.setPixelRatio(1);
        composer.setSize(1920, 1200);
        camera.aspect = 1.6;
        camera.updateProjectionMatrix();
        controls.update();
        composer.render();
        image = renderer.domElement.toDataURL('image/png');
      } finally {
        renderer.setPixelRatio(previousPixelRatio);
        renderer.setSize(previousSize.x, previousSize.y, false);
        composer.setPixelRatio(previousPixelRatio);
        composer.setSize(previousSize.x, previousSize.y);
        camera.aspect = previousSize.x / previousSize.y;
        camera.updateProjectionMatrix();
        camera.position.copy(previousPosition);
        controls.target.copy(previousTarget);
        controls.update();
        setLighting(previousLighting);
      }
      return image;
    };

    stateRef.current = { applyPreset, setLighting, capture };

    let visible = true;
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    visibility.observe(mount);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!visible) return;
      controls.update();
      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      controls.dispose();
      composer.dispose();
      ao.dispose();
      bloomPass.dispose();
      const geometries = new Set<THREE.BufferGeometry>([boxGeometry, cylinderGeometry, sphereGeometry, planeGeometry]);
      const disposedMaterials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
        const material = (object as THREE.Mesh).material;
        if (Array.isArray(material)) material.forEach((item) => disposedMaterials.add(item));
        else if (material) disposedMaterials.add(material);
      });
      Object.values(materials).forEach((material) => {
        if (Array.isArray(material)) material.forEach((item) => disposedMaterials.add(item));
        else disposedMaterials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      disposedMaterials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      shadowTexture.dispose();
      daySkyTexture.dispose();
      nightSkyTexture.dispose();
      dayEnvironment.texture.dispose();
      nightEnvironment.texture.dispose();
      pmrem.dispose();
      stateRef.current = null;
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [spec, height, seed]);

  return (
    <div className="space-y-2">
      <div ref={mountRef} style={{ height }} className="overflow-hidden rounded-lg border border-agdark-100 bg-agdark-50" />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-agdark-800 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
        <span>Realistic interactive 3D model</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => stateRef.current?.applyPreset('front')} className="rounded border border-agdark-600 px-1.5 py-0.5 text-[9px] hover:bg-agdark-700">Front</button>
          <button type="button" onClick={() => stateRef.current?.applyPreset('corner')} className="rounded border border-agdark-600 px-1.5 py-0.5 text-[9px] hover:bg-agdark-700">Corner</button>
          <button type="button" onClick={() => stateRef.current?.applyPreset('aerial')} className="rounded border border-agdark-600 px-1.5 py-0.5 text-[9px] hover:bg-agdark-700">Aerial</button>
          <button
            type="button"
            onClick={() => { stateRef.current?.setLighting('day'); setLightingMode('day'); }}
            className={`rounded border px-1.5 py-0.5 text-[9px] ${lightingMode === 'day' ? 'border-agorange text-agorange' : 'border-agdark-600 hover:bg-agdark-700'}`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => { stateRef.current?.setLighting('night'); setLightingMode('night'); }}
            className={`rounded border px-1.5 py-0.5 text-[9px] ${lightingMode === 'night' ? 'border-agorange text-agorange' : 'border-agdark-600 hover:bg-agdark-700'}`}
          >
            Night
          </button>
          <button
            type="button"
            onClick={() => setShowPlan((current) => !current)}
            aria-pressed={showPlan}
            className="rounded border border-agorange px-1.5 py-0.5 text-[9px] text-agorange hover:bg-agdark-700"
          >
            {showPlan ? 'Hide plan' : 'Floor plan'}
          </button>
        </div>
      </div>
      <p className="font-monoData text-[9px] text-agdark-400">Variant {(seed % 999) + 1} · drag to rotate · scroll to zoom · right-drag to pan</p>
      {showPlan ? <HouseFloorPlan plan={buildHousePlan(spec, seed || 1)} compact /> : null}
    </div>
  );
});

export default House3DViewer;
