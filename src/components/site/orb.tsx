"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* Classic 3D simplex noise (Ashima / Stefan Gustavson), used to displace the orb. */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const ORB_VERT = /* glsl */ `
uniform float uTime; uniform float uAmp; uniform float uPulse;
varying vec3 vNormal; varying vec3 vView; varying float vDisp;
${NOISE}
void main(){
  float n = snoise(normal*1.6 + uTime*0.35);
  float n2 = snoise(normal*4.0 - uTime*0.5)*0.35;
  float d = (n + n2) * uAmp + uPulse * 0.18 * sin(uTime*18.0 + position.y*6.0);
  vDisp = d;
  vec3 p = position + normal * d;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  vView = -mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const ORB_FRAG = /* glsl */ `
uniform float uTime; uniform float uPulse;
varying vec3 vNormal; varying vec3 vView; varying float vDisp;
void main(){
  vec3 N = normalize(vNormal); vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(N,V),0.0), 2.4);
  vec3 ink = vec3(0.05,0.047,0.04);
  vec3 plasma = vec3(1.0,0.24,0.51);
  vec3 arc = vec3(0.18,0.66,1.0);
  vec3 cream = vec3(0.95,0.93,0.88);
  float band = 0.5 + 0.5*sin(vDisp*9.0 + uTime*0.8 + N.y*2.5);
  vec3 hue = mix(arc, plasma, smoothstep(-0.5,0.7,N.x*0.8+N.y*0.4+sin(uTime*0.3)*0.3));
  // a dim, warm interior with light pooling where the surface swells
  vec3 body = mix(ink, mix(arc, plasma, band), 0.09 + max(vDisp,0.0)*1.4);
  float core = pow(max(dot(N,V),0.0), 3.0);
  vec3 col = body + hue * core * 0.16;
  col += hue * fres * 1.6;
  col += cream * pow(fres, 7.0) * 0.7;
  col += plasma * uPulse * 0.35;
  gl_FragColor = vec4(col, 1.0);
}`;

const HALO_VERT = /* glsl */ `
varying vec3 vNormal; varying vec3 vView;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vView = -mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const HALO_FRAG = /* glsl */ `
uniform float uTime; uniform float uPulse;
varying vec3 vNormal; varying vec3 vView;
void main(){
  vec3 N = normalize(vNormal); vec3 V = normalize(vView);
  // brightest just outside the orb's edge, fading softly into the room
  float rim = pow(max(dot(-N, V), 0.0), 2.6);
  vec3 plasma = vec3(1.0,0.24,0.51);
  vec3 arc = vec3(0.18,0.66,1.0);
  vec3 hue = mix(arc, plasma, smoothstep(-0.6, 0.6, N.x*0.9 - N.y*0.3 + sin(uTime*0.25)*0.25));
  vec3 c = hue * rim * (0.55 + uPulse*0.5);
  // premultiplied: alpha follows brightness so the canvas stays clear where the glow fades
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}`;

export function Orb({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const small = window.innerWidth < 768; // phones get lighter geometry
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL → the CSS glow behind stays as a graceful fallback
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2)); // crisp on retina
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    const root = new THREE.Group();
    scene.add(root);

    // orb
    const orbU = { uTime: { value: 0 }, uAmp: { value: 0.16 }, uPulse: { value: 0 } };
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, small ? 22 : 40),
      new THREE.ShaderMaterial({ uniforms: orbU, vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, transparent: true }),
    );
    root.add(orb);

    // atmosphere: a back-facing shell that glows at the rim, so the orb lights the air around it
    const haloU = { uTime: { value: 0 }, uPulse: { value: 0 } };
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(1.25 * 1.55, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: haloU,
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        premultipliedAlpha: true,
      }),
    );
    scene.add(halo);

    // interaction state
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, speed: 0, lx: 0, ly: 0 };
    let pulse = 0, scrollT = 0, raf = 0, visible = true;
    const t0 = performance.now();

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();

    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.speed = Math.min(1, pointer.speed + Math.hypot(e.clientX - pointer.lx, e.clientY - pointer.ly) / 600);
      pointer.lx = e.clientX; pointer.ly = e.clientY;
    };
    const onScroll = () => (scrollT = Math.min(1, window.scrollY / window.innerHeight));
    const onClick = () => {
      pulse = 1;
    };

    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      pointer.speed *= 0.95;
      pulse *= 0.94;

      orbU.uTime.value = t;
      orbU.uAmp.value = 0.11 + pointer.speed * 0.2;
      orbU.uPulse.value = pulse;

      root.rotation.y = t * 0.12 + pointer.x * 0.6 + scrollT * 1.2;
      root.rotation.x = pointer.y * 0.35 + scrollT * 0.3;
      haloU.uTime.value = t;
      haloU.uPulse.value = pulse;
      halo.scale.setScalar(1 + Math.sin(t * 1.3) * 0.015 + pulse * 0.06);
      root.position.y = scrollT * -0.6;
      root.scale.setScalar(1 - scrollT * 0.18);
      halo.position.y = root.position.y;


      renderer.render(scene, camera);
      if (!reduced && visible) raf = requestAnimationFrame(tick);
    };
    tick();

    let onScreen = true;
    const sync = () => {
      const was = visible;
      visible = onScreen && !document.hidden;
      if (visible && !was && !reduced) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    document.addEventListener("visibilitychange", sync);
    io.observe(el);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("click", onClick);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={className} role="img" aria-label="A glowing orb of pink and blue light." />;
}
