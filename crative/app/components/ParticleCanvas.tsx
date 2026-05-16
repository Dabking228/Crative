'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../home.module.css';

export default function ParticleCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        const THREE = (window as any).THREE;
        if (!THREE || !containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        camera.position.z = 8;

        let animId: number;
        let scrollPercent = 0;

        const handleScroll = () => {
            scrollPercent =
                (document.documentElement.scrollTop || document.body.scrollTop) /
                ((document.documentElement.scrollHeight || document.body.scrollHeight) -
                    document.documentElement.clientHeight);
        };
        window.addEventListener('scroll', handleScroll);

        // Render loop placeholder while image loads
        const idleLoop = () => {
            animId = requestAnimationFrame(idleLoop);
            renderer.render(scene, camera);
        };
        idleLoop();

        let particleGroup: any = null;
        let particles: any = null;
        let particleCount = 0;
        let initialPositions: Float32Array;
        let targetPositions: Float32Array;

        const img = new Image();
        img.src = '/rm100.jpg';

        img.onload = () => {
            setLoadState('ready');

            const offscreen = document.createElement('canvas');
            const ctx = offscreen.getContext('2d')!;
            const scale = 0.5;
            offscreen.width = Math.floor(img.width * scale);
            offscreen.height = Math.floor(img.height * scale);
            ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
            const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;

            const coords: { x: number; y: number }[] = [];
            const colorValues: number[] = [];

            for (let y = 0; y < offscreen.height; y += 3) {
                for (let x = 0; x < offscreen.width; x += 3) {
                    const idx = (y * offscreen.width + x) * 4;
                    const r = imgData[idx];
                    const g = imgData[idx + 1];
                    const b = imgData[idx + 2];
                    const a = imgData[idx + 3];
                    if (a > 10 && (r < 254 || g < 254 || b < 254)) {
                        coords.push({
                            x: (x - offscreen.width / 2) / 100,
                            y: -(y - offscreen.height / 2) / 100,
                        });
                        colorValues.push(r / 255, g / 255, b / 255);
                    }
                }
            }

            particleCount = coords.length;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colorArray = new Float32Array(colorValues);
            initialPositions = new Float32Array(particleCount * 3);
            targetPositions = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                const sx = coords[i].x;
                const sy = coords[i].y;
                const sz = (Math.random() - 0.5) * 0.2;
                initialPositions[i * 3] = sx;
                initialPositions[i * 3 + 1] = sy;
                initialPositions[i * 3 + 2] = sz;

                const radius = Math.random() * 40 + 2;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);
                targetPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + 4;
                targetPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                targetPositions[i * 3 + 2] = radius * Math.cos(phi);

                positions[i * 3] = sx;
                positions[i * 3 + 1] = sy;
                positions[i * 3 + 2] = sz;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

            const material = new THREE.PointsMaterial({
                size: 0.05,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
            });

            particles = new THREE.Points(geometry, material);
            particleGroup = new THREE.Group();
            particleGroup.position.x = -4;
            particleGroup.add(particles);
            scene.add(particleGroup);

            cancelAnimationFrame(animId);

            const animate = () => {
                animId = requestAnimationFrame(animate);

                particles.rotation.y += 0.01;
                particles.rotation.x = scrollPercent * 1.5;

                const attr = particles.geometry.getAttribute('position');
                const cur = attr.array as Float32Array;
                const progress = Math.pow(scrollPercent, 1.2);
                for (let i = 0; i < particleCount * 3; i++) {
                    cur[i] = THREE.MathUtils.lerp(initialPositions[i], targetPositions[i], progress);
                }
                attr.needsUpdate = true;

                if (indicatorRef.current) {
                    indicatorRef.current.style.opacity =
                        scrollPercent > 0.01
                            ? String(Math.max(0, 0.5 - scrollPercent * 10))
                            : '0.5';
                }

                renderer.render(scene, camera);
            };
            animate();
        };

        img.onerror = () => setLoadState('error');

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (particleGroup) {
                if (window.innerWidth < 768) {
                    particleGroup.position.y = 3;
                    particleGroup.position.x = 0;
                } else {
                    particleGroup.position.y = 0;
                    particleGroup.position.x = -4;
                }
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <>
            {loadState === 'loading' && (
                <div className={styles.loadingOverlay}>Scanning Banknote...</div>
            )}
            {loadState === 'error' && (
                <div className={styles.loadingOverlay} style={{ color: 'red' }}>
                    Error: Could not load image.
                </div>
            )}
            <div ref={containerRef} className={styles.canvasContainer} />
            <div className={styles.uiLayer}>
                <div className={styles.leftHalf} />
                <div className={styles.rightHalf}>
                    <h1 className={styles.heading}>
                        Discover the<br />best of you
                    </h1>
                </div>
            </div>
            <div ref={indicatorRef} className={styles.scrollIndicator}>
                SCROLL DOWN ↓
            </div>
        </>
    );
}
