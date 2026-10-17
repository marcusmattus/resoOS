'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RESOS_NEURAL_LINKS, NeuralLink } from '@/lib/resonances';
import { 
  Scan, 
  Rotate3d, 
  Eye, 
  Radio, 
  Zap, 
  Activity, 
  ChevronUp, 
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

interface BiofieldScanner3DProps {
  activeLink: NeuralLink | null;
  onSelectLink: (link: NeuralLink) => void;
  isScanning: boolean;
  onScanComplete?: (imbalancedLinks: string[]) => void;
  heartRate: number;
  coherenceScore: number;
}

// Scratch math objects to prevent GC in RAF loop
const _tempVec3 = new THREE.Vector3();
const _camTarget = new THREE.Vector3(0, 1.05, 0);
const _camPos = new THREE.Vector3(0, 1.3, 3.8);

export default function BiofieldScanner3D({
  activeLink,
  onSelectLink,
  isScanning,
  onScanComplete,
  heartRate,
  coherenceScore,
}: BiofieldScanner3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [viewAngle, setViewAngle] = useState<'full' | 'cranial' | 'thoracic' | 'solar' | 'biofield'>('full');
  const [hoveredNode, setHoveredNode] = useState<NeuralLink | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Refs for animation loop access without re-mounting
  const activeLinkRef = useRef(activeLink);
  const isScanningRef = useRef(isScanning);
  const onScanCompleteRef = useRef(onScanComplete);
  const heartRateRef = useRef(heartRate);
  const coherenceRef = useRef(coherenceScore);

  useEffect(() => {
    activeLinkRef.current = activeLink;
    isScanningRef.current = isScanning;
    onScanCompleteRef.current = onScanComplete;
    heartRateRef.current = heartRate;
    coherenceRef.current = coherenceScore;
  }, [activeLink, isScanning, onScanComplete, heartRate, coherenceScore]);

  // Camera targets controlled by view preset or selected link
  const targetCamPos = useRef(new THREE.Vector3(0, 1.3, 3.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.05, 0));

  useEffect(() => {
    if (!activeLink) {
      if (viewAngle === 'full') {
        targetCamPos.current.set(0, 1.25, 3.8);
        targetLookAt.current.set(0, 1.05, 0);
      } else if (viewAngle === 'cranial') {
        targetCamPos.current.set(0, 1.95, 1.5);
        targetLookAt.current.set(0, 1.95, 0);
      } else if (viewAngle === 'thoracic') {
        targetCamPos.current.set(0, 1.25, 1.6);
        targetLookAt.current.set(0, 1.25, 0);
      } else if (viewAngle === 'solar') {
        targetCamPos.current.set(0, 0.85, 1.6);
        targetLookAt.current.set(0, 0.85, 0);
      } else if (viewAngle === 'biofield') {
        targetCamPos.current.set(0, 1.4, 4.8);
        targetLookAt.current.set(0, 1.05, 0);
      }
    } else {
      const [nx, ny, nz] = activeLink.threePosition;
      targetLookAt.current.set(nx, ny, nz);
      targetCamPos.current.set(nx * 0.5, ny + 0.1, nz + 1.8);
    }
  }, [activeLink, viewAngle]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep cybernetic bio-indigo
    scene.fog = new THREE.FogExp2(0x060913, 0.12);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 3.8);

    // Renderer
    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    const renderer = new THREE.WebGLRenderer({ antialias: !isHeadless, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment map via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point Lighting
    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2); // Warm daylight key
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = !isHeadless;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2); // Cool cyan sky / deep navy ground
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 2.0); // Violet biofield rim light
    rimLight.position.set(-3.0, 2.5, -2.5);
    scene.add(rimLight);

    // Ground Platform with Radial Contact Shadow
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090e1c,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = !isHeadless;
    scene.add(floor);

    // Soft Radial Ground Ring Pattern
    const ringGeo = new THREE.RingGeometry(0.3, 1.6, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const groundRing = new THREE.Mesh(ringGeo, ringMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.01;
    scene.add(groundRing);

    // -------------------------------------------------------------------------
    // COMPOSITE 3D HUMAN ANATOMICAL HOLOGRAM (3–12 Part Procedural Model Group)
    // -------------------------------------------------------------------------
    const humanGroup = new THREE.Group();
    humanGroup.position.set(0, 0, 0);
    scene.add(humanGroup);

    // Materials with distinctive PBR roughness/metalness differences
    const glassSkinMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.1,
      transmission: 0.85,
      thickness: 0.4,
      wireframe: false,
    });

    const innerWireMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });

    const boneMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.45,
      metalness: 0.65,
    });

    // 1. Torso (Chest & Abdomen)
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.72, 24);
    const torso = new THREE.Mesh(torsoGeo, glassSkinMat);
    torso.position.y = 1.12;
    torso.castShadow = true;
    humanGroup.add(torso);

    const torsoWire = new THREE.Mesh(torsoGeo, innerWireMat);
    torsoWire.position.y = 1.12;
    humanGroup.add(torsoWire);

    // 2. Ribcage Scaffold (Secondary Read)
    const ribcageGroup = new THREE.Group();
    ribcageGroup.position.y = 1.25;
    for (let r = 0; r < 5; r++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.23 - r * 0.015, 0.012, 8, 24, Math.PI * 1.5),
        boneMat
      );
      rib.rotation.x = Math.PI / 2;
      rib.position.y = 0.12 - r * 0.06;
      ribcageGroup.add(rib);
    }
    humanGroup.add(ribcageGroup);

    // 3. Spinal Column (Axial vertebra chain)
    const spineGroup = new THREE.Group();
    for (let s = 0; s < 12; s++) {
      const vert = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.035, 12),
        new THREE.MeshStandardMaterial({ color: 0x67e8f9, roughness: 0.3, metalness: 0.8 })
      );
      vert.position.set(0, 0.78 + s * 0.07, -0.06);
      spineGroup.add(vert);
    }
    humanGroup.add(spineGroup);

    // 4. Head & Cranial Dome
    const headGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const head = new THREE.Mesh(headGeo, glassSkinMat);
    head.scale.set(0.9, 1.18, 0.95);
    head.position.y = 1.95;
    humanGroup.add(head);

    const headWire = new THREE.Mesh(headGeo, innerWireMat);
    headWire.scale.set(0.9, 1.18, 0.95);
    headWire.position.y = 1.95;
    humanGroup.add(headWire);

    // 5. Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.16, 16),
      glassSkinMat
    );
    neck.position.y = 1.62;
    humanGroup.add(neck);

    // 6. Pelvis / Hips
    const pelvis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.16, 0.22, 18),
      glassSkinMat
    );
    pelvis.position.y = 0.65;
    humanGroup.add(pelvis);

    // 7. Upper Limbs (Shoulders, Biceps, Forearms)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.35, 1.35, 0);
    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.34, 14), glassSkinMat);
    leftBicep.position.y = -0.17;
    leftArmGroup.add(leftBicep);
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.36, 14), glassSkinMat);
    leftForearm.position.y = -0.48;
    leftArmGroup.add(leftForearm);
    humanGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.35, 1.35, 0);
    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.34, 14), glassSkinMat);
    rightBicep.position.y = -0.17;
    rightArmGroup.add(rightBicep);
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.36, 14), glassSkinMat);
    rightForearm.position.y = -0.48;
    rightArmGroup.add(rightForearm);
    humanGroup.add(rightArmGroup);

    // 8. Lower Limbs (Thighs, Calves, Feet)
    const createLeg = (x: number) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(x, 0.54, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.44, 16), glassSkinMat);
      thigh.position.y = -0.22;
      legGroup.add(thigh);
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.44, 16), glassSkinMat);
      calf.position.y = -0.66;
      legGroup.add(calf);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), glassSkinMat);
      foot.position.set(0, -0.89, 0.04);
      legGroup.add(foot);
      return legGroup;
    };
    humanGroup.add(createLeg(-0.13));
    humanGroup.add(createLeg(0.13));

    // 9. Pulsating Heart Mesh (Internal Organ Accent)
    const heartGeo = new THREE.OctahedronGeometry(0.07, 2);
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.3,
    });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0.03, 1.25, 0.05);
    humanGroup.add(heartMesh);

    // 10. Torus Electromagnetic Biofield Lines
    const auraGroup = new THREE.Group();
    const torusAuraGeo = new THREE.TorusGeometry(0.95, 0.45, 16, 64);
    const torusAuraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.09,
    });
    const auraMesh = new THREE.Mesh(torusAuraGeo, torusAuraMat);
    auraMesh.rotation.x = Math.PI / 2;
    auraMesh.position.y = 1.1;
    auraGroup.add(auraMesh);

    // Secondary Outer Aura Field
    const outerAuraGeo = new THREE.TorusGeometry(1.35, 0.3, 16, 64);
    const outerAuraMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    });
    const outerAuraMesh = new THREE.Mesh(outerAuraGeo, outerAuraMat);
    outerAuraMesh.rotation.x = Math.PI / 2;
    outerAuraMesh.position.y = 1.1;
    auraGroup.add(outerAuraMesh);
    scene.add(auraGroup);

    // 11. Energy Meridian Nodes (The 12 Neural Links in 3D Space)
    const nodeMeshes: { mesh: THREE.Mesh; halo: THREE.Mesh; link: NeuralLink }[] = [];
    const raycastTargets: THREE.Mesh[] = [];

    RESOS_NEURAL_LINKS.forEach((link) => {
      const nodeGroup = new THREE.Group();
      const [x, y, z] = link.threePosition;
      nodeGroup.position.set(x, y, z);

      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(link.colorHex),
        emissive: new THREE.Color(link.colorHex),
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.8,
      });
      const nodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
      nodeMesh.userData = { linkId: link.id, link };
      nodeGroup.add(nodeMesh);

      // Glowing Halo Ring
      const haloGeo = new THREE.RingGeometry(0.065, 0.095, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(link.colorHex),
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(halo);

      humanGroup.add(nodeGroup);
      nodeMeshes.push({ mesh: nodeMesh, halo, link });
      raycastTargets.push(nodeMesh);
    });

    // 12. Electromagnetic Scan Laser / Beam Slice
    const scanPlaneGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const scanPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const scanPlane = new THREE.Mesh(scanPlaneGeo, scanPlaneMat);
    scanPlane.rotation.x = Math.PI / 2;
    scanPlane.position.y = 2.2;
    scene.add(scanPlane);

    // 13. Meridian Energy Flow Curves (Connecting the 12 nodes)
    const curvePoints = RESOS_NEURAL_LINKS.map(
      (l) => new THREE.Vector3(...l.threePosition)
    );
    const spline = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(spline, 64, 0.008, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const meridianTube = new THREE.Mesh(tubeGeo, tubeMat);
    humanGroup.add(meridianTube);

    // -------------------------------------------------------------------------
    // Raycasting & Pointer Interactions
    // -------------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastTargets, false);
      if (intersects.length > 0) {
        const hitLink = (intersects[0].object.userData as { link: NeuralLink }).link;
        setHoveredNode(hitLink);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (Math.abs(e.clientX - prevMouseX) < 4 && Math.abs(e.clientY - prevMouseY) < 4) {
        // Clicked!
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(raycastTargets, false);
        if (intersects.length > 0) {
          const hitLink = (intersects[0].object.userData as { link: NeuralLink }).link;
          onSelectLink(hitLink);
        }
      }
      isMouseDown = false;
    };

    const handleMouseMoveDrag = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      rotationY += deltaX * 0.008;
      humanGroup.rotation.y = rotationY;
      auraGroup.rotation.y = rotationY * 0.7;
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMoveDrag);

    // -------------------------------------------------------------------------
    // Animation Loop (Damped Camera, Lossless 60fps, Zero GC)
    // -------------------------------------------------------------------------
    let animId: number;
    let clock = new THREE.Clock();
    let scanY = 2.2;
    let scanDir = -1;
    let scanStepCounter = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      // Damped camera movement using exponential smoothing
      const dampFactor = 1 - Math.exp(-4.5 * delta);
      camera.position.lerp(targetCamPos.current, dampFactor);
      _camTarget.lerp(targetLookAt.current, dampFactor);
      camera.lookAt(_camTarget);

      // Heartbeat pulse synchronized to actual user heart rate
      const currentHR = heartRateRef.current || 68;
      const beatFreq = (currentHR / 60) * Math.PI * 2;
      const heartPulse = 1 + Math.sin(time * beatFreq) * 0.18;
      heartMesh.scale.set(heartPulse, heartPulse, heartPulse);

      // Aura field breathing rotation & expansion
      auraGroup.rotation.z = time * 0.15;
      outerAuraGroup_rotation: {
        outerAuraMesh.rotation.z = -time * 0.08;
      }

      // Ground energy ripple
      groundRing.scale.setScalar(1 + Math.sin(time * 1.5) * 0.05);

      // Neural Link halo rotation and active highlight
      const activeId = activeLinkRef.current?.id;
      nodeMeshes.forEach(({ halo, link }) => {
        halo.rotation.z = time * 1.2;
        const isActive = activeId === link.id;
        const targetScale = isActive ? 1.6 + Math.sin(time * 4) * 0.25 : 1.0;
        halo.scale.setScalar(targetScale);
        (halo.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.9 : 0.45;
      });

      // Biofield Scanning Sweep
      if (isScanningRef.current) {
        scanPlane.visible = true;
        (scanPlane.material as THREE.MeshBasicMaterial).opacity = 0.55;
        scanY += scanDir * delta * 0.75;
        if (scanY <= -0.1) {
          scanY = -0.1;
          scanDir = 1;
        } else if (scanY >= 2.2 && scanDir === 1) {
          scanY = 2.2;
          scanDir = -1;
          scanStepCounter++;
          if (scanStepCounter >= 2 && onScanCompleteRef.current) {
            onScanCompleteRef.current(['link-3', 'link-4', 'link-8']); // Identified vagal/cardiac/pulmonary pattern
          }
        }
        scanPlane.position.y = scanY;
        const progressPct = Math.round(((2.2 - scanY) / 2.3) * 100);
        setScanProgress(progressPct);
      } else {
        scanPlane.visible = false;
        setScanProgress(0);
      }

      renderer.render(scene, camera);
    };

    // Pre-warm WebGL shader pipeline
    renderer.compile(scene, camera);
    animate();

    // Window resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMoveDrag);

      // Dispose geometries & materials
      floorGeo.dispose();
      floorMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      torsoGeo.dispose();
      glassSkinMat.dispose();
      innerWireMat.dispose();
      boneMat.dispose();
      headGeo.dispose();
      heartGeo.dispose();
      heartMat.dispose();
      torusAuraGeo.dispose();
      torusAuraMat.dispose();
      outerAuraGeo.dispose();
      outerAuraMat.dispose();
      scanPlaneGeo.dispose();
      scanPlaneMat.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelectLink]);

  return (
    <div className="relative w-full h-[620px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec & Live Biometric Header Badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 text-white pointer-events-auto shadow-lg">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5" />
              ResOS Biofield Hologram
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              12 Neural Links | Torus EM Lattice
            </div>
          </div>
        </div>

        {/* Live Heartbeat & Coherence Telemetry Overlay */}
        <div className="bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-500/30 text-white pointer-events-auto flex items-center gap-4 shadow-lg">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Live Pulse</div>
              <div className="text-sm font-bold font-mono text-rose-300">{heartRate} <span className="text-[10px]">BPM</span></div>
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Coherence</div>
              <div className="text-sm font-bold font-mono text-emerald-300">{coherenceScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hovered / Active Node Tooltip Badge */}
      {(hoveredNode || activeLink) && (
        <div className="absolute top-20 left-4 bg-slate-900/90 border border-slate-700 px-4 py-2.5 rounded-xl text-white shadow-xl max-w-xs transition-all duration-200 pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: (hoveredNode || activeLink)?.colorHex }}
            />
            <span className="text-xs font-bold text-cyan-300">
              {(hoveredNode || activeLink)?.name}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {(hoveredNode || activeLink)?.bodyPart}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
            Frequency: {(hoveredNode || activeLink)?.primaryFrequencyHz} Hz ({((hoveredNode || activeLink)?.brainwaveBand)})
          </div>
        </div>
      )}

      {/* Active Scan Progress Bar Banner */}
      {isScanning && (
        <div className="absolute top-20 right-4 bg-cyan-950/90 border border-cyan-500/50 px-4 py-2 rounded-xl text-white shadow-xl min-w-[220px]">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-mono mb-1">
            <span>EM SCAN IN PROGRESS</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-100"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Control Dock (< 15% Viewport footprint) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 shadow-2xl">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera & Anatomical View Focus</span>
            </div>
            <button
              onClick={() => setControlsOpen(!controlsOpen)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-slate-800"
            >
              {controlsOpen ? (
                <>
                  <span>Minimize Dock</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Expand Controls</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {controlsOpen && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setViewAngle('full')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewAngle === 'full' && !activeLink
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Whole Body
                </button>
                <button
                  onClick={() => setViewAngle('cranial')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewAngle === 'cranial' && !activeLink
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cranial-Pineal
                </button>
                <button
                  onClick={() => setViewAngle('thoracic')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewAngle === 'thoracic' && !activeLink
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cardiac-Thymus
                </button>
                <button
                  onClick={() => setViewAngle('solar')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewAngle === 'solar' && !activeLink
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Solar-Celiac
                </button>
                <button
                  onClick={() => setViewAngle('biofield')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    viewAngle === 'biofield' && !activeLink
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Torus Aura
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>Drag to rotate</span>
                <span>•</span>
                <span>Click node to tune</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
