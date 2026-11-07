import React, { useRef, useEffect } from 'react';

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    let animId;
    let renderer, scene, camera, group, core, wire, ring, pts, cards = [];
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const initThree = (THREE) => {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(0, 0, 9);

      scene.add(new THREE.AmbientLight(0x9a8cff, 0.7));
      const L1 = new THREE.PointLight(0x34f0c8, 2.2, 40);
      L1.position.set(4, 4, 6);
      scene.add(L1);

      const L2 = new THREE.PointLight(0xff6f91, 1.6, 40);
      L2.position.set(-5, -3, 4);
      scene.add(L2);

      group = new THREE.Group();
      scene.add(group);

      core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.1, 1),
        new THREE.MeshStandardMaterial({
          color: 0x34f0c8,
          emissive: 0x0b6a58,
          metalness: 0.5,
          roughness: 0.25,
          flatShading: true,
        })
      );
      group.add(core);

      wire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.6, 1),
        new THREE.MeshBasicMaterial({
          color: 0x9a8cff,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        })
      );
      group.add(wire);

      ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.015, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0x34f0c8, transparent: true, opacity: 0.5 })
      );
      ring.rotation.x = Math.PI / 2.4;
      group.add(ring);

      // Starfield particles
      const pg = new THREE.BufferGeometry();
      const pa = [];
      for (let i = 0; i < 500; i++) {
        const r = 6 + Math.random() * 10;
        const a = Math.random() * 6.28;
        const b = Math.acos(2 * Math.random() - 1);
        pa.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a));
      }
      pg.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3));
      pts = new THREE.Points(
        pg,
        new THREE.PointsMaterial({ color: 0xc9bfff, size: 0.06, transparent: true, opacity: 0.7 })
      );
      scene.add(pts);

      const subs = [
        ['Streamly', '$15.99', '#7b6cff'],
        ['TuneBox', '$10.99', '#34f0c8'],
        ['FitClub', '$39.00', '#ffb86b'],
        ['CloudDrive', '$9.99', '#6bb7ff'],
        ['PixelPro', '$22.50', '#ff9ad5'],
        ['NewsPlus', '$12.00', '#c4f06b'],
        ['GameVault', '$14.99', '#ff8a6b'],
        ['TuneWave', '$10.99', '#34f0c8'],
      ];

      function rr(ctx, a, b, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(a + r, b);
        ctx.arcTo(a + w, b, a + w, b + h, r);
        ctx.arcTo(a + w, b + h, a, b + h, r);
        ctx.arcTo(a, b + h, a, b, r);
        ctx.arcTo(a, b, a + w, b, r);
        ctx.closePath();
      }

      function drawCard(canvas, s, isDead) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 300);
        rr(ctx, 8, 8, 496, 284, 40);
        ctx.fillStyle = isDead ? 'rgba(60,12,40,0.92)' : 'rgba(24,14,70,0.9)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isDead ? '#ff6f91' : 'rgba(190,170,255,0.45)';
        ctx.stroke();

        rr(ctx, 40, 44, 70, 70, 20);
        ctx.fillStyle = isDead ? '#ff6f91' : s[2];
        ctx.fill();
        ctx.fillStyle = '#0b0b22';
        ctx.font = '800 40px sans-serif';
        ctx.fillText(s[0][0], 62, 92);

        ctx.fillStyle = '#efeaff';
        ctx.font = '700 38px sans-serif';
        ctx.fillText(s[0], 130, 92);

        ctx.font = '800 66px sans-serif';
        ctx.fillStyle = isDead ? '#ff6f91' : '#efeaff';
        ctx.fillText(isDead ? 'Cancelled' : s[1] + '/mo', 40, 208);

        ctx.font = '400 26px sans-serif';
        ctx.fillStyle = '#a79fd0';
        ctx.fillText(isDead ? 'Saved ' + s[1] + ' a month' : 'Last used 41 days ago', 40, 254);
      }

      cards = subs.map((s, i) => {
        const cn = document.createElement('canvas');
        cn.width = 512;
        cn.height = 300;
        drawCard(cn, s, false);
        const texture = new THREE.CanvasTexture(cn);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 1.4),
          new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        );
        group.add(mesh);
        return {
          mesh,
          cn,
          texture,
          s,
          ang: (i / subs.length) * 6.283,
          y: i % 2 ? 0.7 : -0.7,
          state: 0,
          k: 0,
        };
      });

      let nextKill = 2;
      const clock = new THREE.Clock();
      let mx = 0, my = 0, tx = 0, ty = 0;

      const handlePointerMove = (e) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener('pointermove', handlePointerMove);

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        // Shift 3D scene cleanly to the right side so it never collides with hero/signin text
        const isDesktop = w > 1024;
        group.position.x = isDesktop ? Math.max(3.6, (w / 1440) * 3.8) : 0;
        group.position.y = isDesktop ? 0 : 2.0;
        group.scale.setScalar(isDesktop ? 0.9 : 0.65);
      };

      window.addEventListener('resize', resize);
      resize();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        core.rotation.y = t * 0.5;
        core.rotation.x = t * 0.3;
        wire.rotation.y = -t * 0.25;
        wire.rotation.z = t * 0.15;
        const pulse = 1 + Math.sin(t * 2) * 0.04;
        core.scale.setScalar(pulse);

        pts.rotation.y = t * 0.02;
        tx += (mx - tx) * 0.05;
        ty += (my - ty) * 0.05;
        group.rotation.y = tx * 0.5 + Math.sin(t * 0.3) * 0.1;
        group.rotation.x = ty * 0.3;

        const sy = Math.min(window.scrollY / window.innerHeight, 1.2);
        camera.position.z = 9 + sy * 3;
        if (renderer.domElement) {
          renderer.domElement.style.opacity = Math.max(0.22, 1 - sy * 0.8);
        }

        if (t > nextKill) {
          const live = cards.filter((c) => c.state === 0);
          if (live.length) {
            const c = live[Math.floor(Math.random() * live.length)];
            c.state = 1;
            c.k = 0;
            drawCard(c.cn, c.s, true);
            c.texture.needsUpdate = true;
          }
          nextKill = t + 2.6;
        }

        cards.forEach((c) => {
          const a = c.ang + t * 0.22;
          const rad = 2.8; // Compact orbit radius so cards stay on the right half
          c.mesh.position.set(Math.cos(a) * rad, c.y + Math.sin(t + c.ang * 3) * 0.12, Math.sin(a) * rad);
          c.mesh.lookAt(c.mesh.position.x * 2, c.mesh.position.y, c.mesh.position.z * 2);

          if (c.state === 1) {
            c.k += 0.012;
            c.mesh.position.multiplyScalar(1 + c.k * 0.6);
            c.mesh.position.y -= c.k * c.k * 4;
            c.mesh.material.opacity = Math.max(0, 1 - c.k);
            c.mesh.scale.setScalar(1 + c.k * 0.3);
            if (c.k >= 1) {
              c.state = 2;
              c.k = 0;
              c.mesh.visible = false;
            }
          } else if (c.state === 2) {
            c.k += 0.016;
            if (c.k > 2) {
              drawCard(c.cn, c.s, false);
              c.texture.needsUpdate = true;
              c.mesh.visible = true;
              c.state = 3;
              c.k = 0;
              c.mesh.scale.setScalar(0.01);
            }
          } else if (c.state === 3) {
            c.k += 0.04;
            const e = Math.min(c.k, 1);
            c.mesh.scale.setScalar(e);
            c.mesh.material.opacity = e;
            if (e >= 1) c.state = 0;
          }
        });

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('resize', resize);
      };
    };

    if (window.THREE) {
      initThree(window.THREE);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => initThree(window.THREE);
      document.head.appendChild(script);
    }

    return () => {
      cancelAnimationFrame(animId);
      if (renderer && renderer.domElement && container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
