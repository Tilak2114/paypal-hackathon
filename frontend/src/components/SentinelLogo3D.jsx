// SentinelLogo3D.jsx — compact inline 3D "S" logo for the navbar
// Renders the same Three.js geometry from the Sentinel brand artifact,
// scaled down to fit cleanly as a 44×44 nav icon.
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SentinelLogo3D({ size = 44, className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const W = size * (window.devicePixelRatio || 1);

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Scene / Camera ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 11);
    camera.lookAt(0, 0, 0);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x6f8fe8, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 4, 6);
    scene.add(key);
    const L1 = new THREE.PointLight(0x8fe5ff, 2.4, 40);
    L1.position.set(5, 3, 5);
    scene.add(L1);
    const L2 = new THREE.PointLight(0xff6f91, 1.5, 40);
    L2.position.set(-5, -3, 4);
    scene.add(L2);

    // ── Build the S path ──
    const D = Math.PI / 180;
    const CL = [];
    function arc(cx, cy, a0, a1, n, skip) {
      for (let i = skip ? 1 : 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * i / n;
        CL.push([cx + Math.cos(a), cy + Math.sin(a)]);
      }
    }
    arc(0,  1, 25 * D, 270 * D, 120, false);
    arc(0, -1, 90 * D, -155 * D, 120, true);

    const N = CL.length;
    const T = [];
    for (let i = 0; i < N; i++) {
      const p = CL[Math.max(i - 1, 0)];
      const q = CL[Math.min(i + 1, N - 1)];
      const dx = q[0] - p[0], dy = q[1] - p[1];
      const l = Math.hypot(dx, dy);
      T.push([dx / l, dy / l]);
    }

    const H = 0.31;
    const poly = [];
    for (let i = 0; i < N; i++) poly.push([CL[i][0] - T[i][1] * H, CL[i][1] + T[i][0] * H]);
    const e = N - 1;
    for (let i = 1; i <= 18; i++) {
      const a = Math.PI * i / 18;
      poly.push([CL[e][0] + H * (-T[e][1] * Math.cos(a) + T[e][0] * Math.sin(a)),
                 CL[e][1] + H * ( T[e][0] * Math.cos(a) + T[e][1] * Math.sin(a))]);
    }
    for (let i = N - 2; i >= 0; i--) poly.push([CL[i][0] + T[i][1] * H, CL[i][1] - T[i][0] * H]);
    for (let i = 1; i < 18; i++) {
      const a2 = Math.PI * i / 18;
      poly.push([CL[0][0] + H * ( T[0][1] * Math.cos(a2) - T[0][0] * Math.sin(a2)),
                 CL[0][1] + H * (-T[0][0] * Math.cos(a2) - T[0][1] * Math.sin(a2))]);
    }

    // ── Build geometry ──
    const G = new THREE.Group();
    const Z = 0.3;
    const mint = new THREE.Color(0x8fe5ff);
    const vio  = new THREE.Color(0x3b63d9);
    const cc   = new THREE.Color();

    function loop3(z, rad, mat) {
      const pts = poly.map(q => new THREE.Vector3(q[0], q[1], z));
      const g = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.3),
        poly.length * 2, rad, 8, true
      );
      const ps = g.attributes.position, col = [];
      for (let k = 0; k < ps.count; k++) {
        const t = Math.min(Math.max((ps.getY(k) + 2.4) / 4.8, 0), 1);
        cc.copy(vio).lerp(mint, t);
        col.push(cc.r, cc.g, cc.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      G.add(new THREE.Mesh(g, mat));
    }

    const core = new THREE.MeshBasicMaterial({ vertexColors: true });
    const halo = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    [Z, -Z].forEach(z => { loop3(z, 0.034, core); loop3(z, 0.1, halo); });

    // Glass fill
    const sh = new THREE.Shape();
    poly.forEach((q, k) => k ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1]));
    const bg = new THREE.ExtrudeGeometry(sh, { depth: Z * 2, bevelEnabled: false, curveSegments: 1 });
    bg.translate(0, 0, -Z);
    G.add(new THREE.Mesh(bg, new THREE.MeshPhysicalMaterial({
      color: 0x8fe5ff, transparent: true, opacity: 0.07,
      roughness: 0.1, side: THREE.DoubleSide, depthWrite: false,
    })));

    // Ribs
    const lp = [];
    for (let i = 0; i < poly.length; i += 7) {
      lp.push(poly[i][0], poly[i][1], Z, poly[i][0], poly[i][1], -Z);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    G.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
      color: 0xa9ecff, transparent: true, opacity: 0.28,
    })));

    // Center group
    const bb = new THREE.Box3().setFromObject(G);
    const ctr = bb.getCenter(new THREE.Vector3());
    G.children.forEach(m => m.position.sub(ctr));
    scene.add(G);

    // Orbit rings (smaller for logo)
    const ring  = new THREE.Group();
    const ring2 = new THREE.Group();
    const m1 = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.018, 10, 160),
      new THREE.MeshBasicMaterial({ color: 0x8fe5ff, transparent: true, opacity: 0.55 })
    );
    m1.rotation.x = Math.PI / 3.1;
    ring.add(m1);
    scene.add(ring);
    const m2 = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.012, 10, 160),
      new THREE.MeshBasicMaterial({ color: 0x6f8fe8, transparent: true, opacity: 0.4 })
    );
    m2.rotation.x = -Math.PI / 3.4;
    ring2.add(m2);
    scene.add(ring2);

    // ── Auto-spin only (no drag on logo) ──
    const spin = reduce ? 0.004 : 0.012;
    let frameId;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      G.rotation.y += spin;
      G.rotation.x = Math.sin(t * 0.8) * 0.08;
      G.position.y = Math.sin(t * 1.2) * 0.05;
      ring.rotation.y  =  t * 0.4;
      ring2.rotation.y = -t * 0.3;
      L1.position.x = Math.cos(t * 0.7) * 5;
      L1.position.z = Math.sin(t * 0.7) * 5;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }}
      aria-label="Sentinel 3D logo"
    />
  );
}
