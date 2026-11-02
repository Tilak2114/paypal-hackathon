import React, { useRef, useEffect } from 'react';

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    let animId;
    let renderer, scene, camera, group, core, wire, ring, pts, cards = [];
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;

    // Load Three.js dynamically or use global window.THREE
    const initThree = (THREE) => {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(0, 0, 8.5);

      scene.add(new THREE.AmbientLight(0x9a8cff, 0.8));
      const L1 = new THREE.PointLight(0x34f0c8, 2.5, 40);
      L1.position.set(4, 4, 6);
      scene.add(L1);

      const L2 = new THREE.PointLight(0xff6f91, 1.8, 40);
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

      // Starfield / ambient dots
      const pg = new THREE.BufferGeometry();
      const pa = [];
      for (let i = 0; i < 400; i++) {
        const r = 5 + Math.random() * 8;
        const a = Math.random() * 6.28;
        const b = Math.acos(2 * Math.random() - 1);
        pa.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a));
      }
      pg.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3));
      pts = new THREE.Points(
        pg,
        new THREE.PointsMaterial({ color: 0xc9bfff, size: 0.05, transparent: true, opacity: 0.7 })
      );
      scene.add(pts);

      // Orbiting Subscriptions
      const subs = [
        ['Streamly', '$15.99', '#7b6cff'],
        ['TuneBox', '$10.99', '#34f0c8'],
        ['FitClub', '$39.00', '#ffb86b'],
        ['PixelPro', '$22.50', '#ff9ad5'],
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

        ctx.font = '800 64px sans-serif';
        ctx.fillStyle = isDead ? '#ff6f91' : '#efeaff';
        ctx.fillText(isDead ? 'Cancelled' : s[1] + '/mo', 40, 208);

        ctx.font = '400 24px sans-serif';
        ctx.fillStyle = '#a79fd0';
        ctx.fillText(isDead ? 'Saved ' + s[1] + '/mo' : 'Last used 41d ago', 40, 254);
      }

      cards = subs.map((s, i) => {
        const cn = document.createElement('canvas');
        cn.width = 512;
        cn.height = 300;
        drawCard(cn, s, false);
        const texture = new THREE.CanvasTexture(cn);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 1.3),
          new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
        );
        group.add(mesh);
        return {
          mesh,
          cn,
          texture,
          s,
          ang: (i / subs.length) * Math.PI * 2,
          y: i % 2 ? 0.6 : -0.6,
          state: 0,
          k: 0,
        };
      });

      let nextKill = 2.5;
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        core.rotation.y = t * 0.4;
        core.rotation.x = t * 0.25;
        wire.rotation.y = -t * 0.2;
        const pulse = 1 + Math.sin(t * 2) * 0.05;
        core.scale.setScalar(pulse);

        if (t > nextKill) {
          const live = cards.filter((c) => c.state === 0);
          if (live.length) {
            const target = live[Math.floor(Math.random() * live.length)];
            target.state = 1;
            target.k = 0;
            drawCard(target.cn, target.s, true);
            target.texture.needsUpdate = true;
          }
          nextKill = t + 2.8;
        }

        cards.forEach((c) => {
          const a = c.ang + t * 0.2;
          const rad = 3.3;
          c.mesh.position.set(Math.cos(a) * rad, c.y + Math.sin(t + c.ang * 2) * 0.12, Math.sin(a) * rad);
          c.mesh.lookAt(c.mesh.position.x * 2, c.mesh.position.y, c.mesh.position.z * 2);

          if (c.state === 1) {
            c.k += 0.015;
            c.mesh.position.multiplyScalar(1 + c.k * 0.5);
            c.mesh.position.y -= c.k * c.k * 3;
            c.mesh.material.opacity = Math.max(0, 1 - c.k);
            if (c.k >= 1) {
              c.state = 2;
              c.k = 0;
              c.mesh.visible = false;
            }
          } else if (c.state === 2) {
            c.k += 0.02;
            if (c.k > 2) {
              drawCard(c.cn, c.s, false);
              c.texture.needsUpdate = true;
              c.mesh.visible = true;
              c.state = 3;
              c.k = 0;
            }
          } else if (c.state === 3) {
            c.k += 0.05;
            const e = Math.min(c.k, 1);
            c.mesh.scale.setScalar(e);
            c.mesh.material.opacity = e;
            if (e >= 1) c.state = 0;
          }
        });

        renderer.render(scene, camera);
      };

      animate();
    };

    if (window.THREE) {
      initThree(window.THREE);
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => initThree(window.THREE);
      document.head.appendChild(script);
    }

    const handleResize = () => {
      if (!renderer || !camera || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer && renderer.domElement && container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full min-h-[440px] relative pointer-events-none" />;
}
