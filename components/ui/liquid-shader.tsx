// src/components/ui/liquid-shader.tsx

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface InteractiveNebulaShaderProps {
    hasActiveReminders?: boolean;
    hasUpcomingReminders?: boolean;
    disableCenterDimming?: boolean;
    className?: string;
}

/**
 * Full-screen nebula shader background.
 * Props drive three GLSL uniforms.
 */
export function InteractiveNebulaShader({
    hasActiveReminders = false,
    hasUpcomingReminders = false,
    disableCenterDimming = false,
    className = "",
}: InteractiveNebulaShaderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // Sync props into uniforms
    useEffect(() => {
        const mat = materialRef.current;
        if (mat) {
            mat.uniforms.hasActiveReminders.value = hasActiveReminders;
            mat.uniforms.hasUpcomingReminders.value = hasUpcomingReminders;
            mat.uniforms.disableCenterDimming.value = disableCenterDimming;
        }
    }, [hasActiveReminders, hasUpcomingReminders, disableCenterDimming]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Renderer, scene, camera, clock
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const clock = new THREE.Clock();

        // Vertex shader: pass UVs
        const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

        // Ray-marched nebula fragment shader with reminder-driven palettes (stark theme)
        const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform bool hasActiveReminders;
      uniform bool hasUpcomingReminders;
      uniform bool disableCenterDimming;
      varying vec2 vUv;

      #define t iTime
      mat2 m(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
      float map(vec3 p){
        p.xz *= m(t*0.4);
        p.xy *= m(t*0.3);
        vec3 q = p*2. + t;
        return length(p + vec3(sin(t*0.7))) * log(length(p)+1.0)
             + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 1.0;
      }

      void mainImage(out vec4 O, in vec2 fragCoord) {
        vec2 uv = fragCoord / min(iResolution.x, iResolution.y) - vec2(.9, .5);
        uv.x += .4;
        vec3 col = vec3(0.0);
        float d = 2.5;

        // Starknet colors: #E44134 (Orange), #3A1E8D (Purple), #0C0C4F (Blue)
        for (int i = 0; i <= 5; i++) {
          vec3 p = vec3(0,0,5.) + normalize(vec3(uv, -1.)) * d;
          float rz = map(p);
          float f  = clamp((rz - map(p + 0.1)) * 0.5, -0.1, 1.0);

          vec3 base = hasActiveReminders
            ? vec3(0.22,0.11,0.55) + vec3(2.0,1.0,4.0)*f // Purple dominant
            : hasUpcomingReminders
            ? vec3(0.04,0.04,0.31) + vec3(1.0,1.0,5.0)*f // Blue dominant
            : vec3(0.89,0.25,0.20) + vec3(5.0,1.5,1.0)*f; // Orange dominant
          
          col = col * base + smoothstep(2.5, 0.0, rz) * 0.7 * base;
          d += min(rz, 1.0);
        }

        float dist   = distance(fragCoord, iResolution*0.5);
        float radius = min(iResolution.x, iResolution.y) * 0.5;
        float dim    = disableCenterDimming
                     ? 1.0
                     : smoothstep(radius*0.3, radius*0.5, dist);

        O = vec4(col, 1.0);
        if (!disableCenterDimming) {
          O.rgb = mix(O.rgb * 0.3, O.rgb, dim);
        }
      }

      void main() {
        mainImage(gl_FragColor, vUv * iResolution);
      }
    `;

        // Uniforms
        const uniforms = {
            iTime: { value: 0 },
            iResolution: { value: new THREE.Vector2() },
            iMouse: { value: new THREE.Vector2() },
            hasActiveReminders: { value: hasActiveReminders },
            hasUpcomingReminders: { value: hasUpcomingReminders },
            disableCenterDimming: { value: disableCenterDimming },
        };

        const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
        materialRef.current = material;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(mesh);

        // Resize & mouse
        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            renderer.setSize(w, h);
            uniforms.iResolution.value.set(w, h);
        };
        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            uniforms.iMouse.value.set(e.clientX - rect.left, rect.height - (e.clientY - rect.top));
        };
        window.addEventListener("resize", onResize);
        container.addEventListener("mousemove", onMouseMove);
        onResize();

        // Animation loop
        renderer.setAnimationLoop(() => {
            uniforms.iTime.value = clock.getElapsedTime() * 0.5; // Slowed down slightly for ambient background
            renderer.render(scene, camera);
        });

        return () => {
            window.removeEventListener("resize", onResize);
            container.removeEventListener("mousemove", onMouseMove);
            renderer.setAnimationLoop(null);
            container.removeChild(renderer.domElement);
            material.dispose();
            mesh.geometry.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 w-full h-full -z-10 mix-blend-screen opacity-60 ${className}`}
            aria-label="Interactive nebula background"
        />
    );
}
