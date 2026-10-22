import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const HeroLivingRibbons: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse coordinate motion values normalized from -1 to 1
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth physical spring damping
  const springConfig = { damping: 24, stiffness: 85 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // 3D Perspective Tilt for the ribbons
  const rotateX = useTransform(smoothY, [-1, 1], [3.5, -3.5]);
  const rotateY = useTransform(smoothX, [-1, 1], [-4, 4]);
  const translateX = useTransform(smoothX, [-1, 1], [-16, 16]);
  const translateY = useTransform(smoothY, [-1, 1], [-12, 12]);

  // Caustic highlight spotlight position tracking cursor
  const spotX = useTransform(smoothX, [-1, 1], ['20%', '80%']);
  const spotY = useTransform(smoothY, [-1, 1], ['15%', '85%']);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;
      // Normalize from center: -1 to +1
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden select-none [perspective:1400px]"
      aria-hidden="true"
    >
      {/* ------------------------------------------------------------------
          1. Color Aura Glows (breathing life behind the mint & pink ribbons)
         ------------------------------------------------------------------ */}
      <motion.div
        className="pointer-events-none absolute -left-36 top-6 h-[540px] w-[540px] rounded-full bg-[#91F5D3]/50 blur-[85px] mix-blend-multiply"
        animate={{
          scale: [1, 1.15, 0.98, 1],
          opacity: [0.35, 0.55, 0.38, 0.35],
          x: [0, 15, -10, 0],
          y: [0, -15, 10, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="pointer-events-none absolute -right-28 -top-12 h-[500px] w-[500px] rounded-full bg-[#FF98C1]/45 blur-[85px] mix-blend-multiply"
        animate={{
          scale: [1, 1.14, 0.96, 1],
          opacity: [0.3, 0.52, 0.32, 0.3],
          x: [0, -12, 10, 0],
          y: [0, 15, -8, 0],
        }}
        transition={{
          duration: 9.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.2,
        }}
      />

      {/* ------------------------------------------------------------------
          2. The Exact 3D Acrylic Ribbons with Physical 3D Tilt & Parallax
         ------------------------------------------------------------------ */}
      <motion.div
        className="absolute -inset-5 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: 'url(/background.png)',
          rotateX,
          rotateY,
          x: translateX,
          y: translateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: [1.05, 1.075, 1.05],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Traveling Specular Caustic Glint across the glass ribbons */}
        <motion.div
          className="pointer-events-none absolute -inset-full opacity-35 mix-blend-overlay"
          style={{
            background:
              'linear-gradient(118deg, transparent 40%, rgba(255,255,255,0.45) 48%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.45) 52%, transparent 60%)',
          }}
          animate={{
            x: ['-100%', '100%'],
            y: ['-100%', '100%'],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            repeatDelay: 3.5,
            ease: 'easeInOut',
          }}
        />

        {/* Dynamic Glass Refraction Spotlight following the cursor */}
        <motion.div
          className="pointer-events-none absolute h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px] mix-blend-soft-light opacity-80"
          style={{
            left: spotX,
            top: spotY,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(145,245,211,0.4) 40%, rgba(255,152,193,0.35) 70%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* ------------------------------------------------------------------
          3. Subtle Floating Prismatic Light Motes (Cinematic Living Quality)
         ------------------------------------------------------------------ */}
      {[
        { x: '18%', y: '65%', size: 4, dur: 7, delay: 0 },
        { x: '82%', y: '45%', size: 5, dur: 8.5, delay: 1.5 },
        { x: '28%', y: '35%', size: 3, dur: 9, delay: 3 },
        { x: '75%', y: '75%', size: 4.5, dur: 7.8, delay: 2 },
        { x: '88%', y: '25%', size: 3.5, dur: 10, delay: 4 },
      ].map((mote, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{
            left: mote.x,
            top: mote.y,
            width: mote.size,
            height: mote.size,
          }}
          animate={{
            y: [0, -32, 0],
            x: [0, (i % 2 === 0 ? 8 : -8), 0],
            opacity: [0.2, 0.75, 0.2],
            scale: [0.8, 1.25, 0.8],
          }}
          transition={{
            duration: mote.dur,
            repeat: Infinity,
            delay: mote.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ------------------------------------------------------------------
          4. Subtle SaaS Grid Texture with Vignette (Linear / Stripe aesthetic)
         ------------------------------------------------------------------ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E5E0E8 1px, transparent 1px), linear-gradient(to bottom, #E5E0E8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, #000 45%, transparent 95%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 65% 55% at 50% 45%, #000 45%, transparent 95%)',
        }}
      />
    </div>
  );
};
