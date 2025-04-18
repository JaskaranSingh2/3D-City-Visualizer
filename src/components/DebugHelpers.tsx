import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

interface DebugHelpersProps {
  visible?: boolean;
  size?: number;
}

export function DebugHelpers({ visible = true, size = 2000 }: DebugHelpersProps) {
  const { scene } = useThree();
  const [stats, setStats] = useState<any>(null);
  
  // Add axes helper
  useEffect(() => {
    if (visible) {
      // Create axes helper
      const axesHelper = new THREE.AxesHelper(size / 4);
      scene.add(axesHelper);
      
      // Create bounding box helper for the scene
      const box = new THREE.Box3().setFromObject(scene);
      const boxHelper = new THREE.Box3Helper(box, new THREE.Color(0xffff00));
      scene.add(boxHelper);
      
      // Cleanup on unmount
      return () => {
        scene.remove(axesHelper);
        scene.remove(boxHelper);
      };
    }
  }, [scene, visible, size]);
  
  // Add stats panel
  useEffect(() => {
    if (visible && typeof window !== 'undefined') {
      import('three/examples/jsm/libs/stats.module.js').then((StatsModule) => {
        const stats = new StatsModule.default();
        stats.dom.style.position = 'absolute';
        stats.dom.style.bottom = '0px';
        stats.dom.style.left = '0px';
        stats.dom.style.zIndex = '100';
        document.body.appendChild(stats.dom);
        
        setStats(stats);
        
        // Cleanup on unmount
        return () => {
          document.body.removeChild(stats.dom);
        };
      });
    }
    
    return () => {
      if (stats) {
        document.body.removeChild(stats.dom);
      }
    };
  }, [visible]);
  
  // Update stats on each frame
  useEffect(() => {
    if (stats) {
      const animate = () => {
        stats.update();
        requestAnimationFrame(animate);
      };
      
      requestAnimationFrame(animate);
    }
  }, [stats]);
  
  return null; // This component doesn't render anything directly
}
