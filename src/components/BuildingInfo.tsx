"use client";

import React from 'react';
import { Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/web';
import { LoaderIcon } from './LoaderIcon';

interface BuildingInfoProps {
  position: [number, number, number];
  userData: any;
  visible: boolean;
  isLoading?: boolean;
}

export function BuildingInfo({ position, userData, visible, isLoading = false }: BuildingInfoProps) {
  // Animation for fading in/out
  const { opacity } = useSpring({
    opacity: visible ? 1 : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Extract building information
  const buildingName = userData.name || 'Unknown Building';
  const buildingLevels = userData['building:levels'] || '?';
  const buildingHeight = userData.actualHeight || (userData.height ? `${userData.height}m` : 'Unknown');
  const buildingType = userData.building || 'building';
  const buildingYear = userData.start_date || 'Unknown';
  const buildingUse = userData.amenity || userData.shop || userData.office || 'General';

  // Extract AI-generated data if available
  const summary = userData.summary || null;
  const constructionCost = userData.constructionCost || null;
  const urbanSignificance = userData.urbanSignificance || null;
  const assessedValue = userData.assessedValue || null;
  const zoning = userData.zoning || null;

  // Log userData to help debug
  console.log('BuildingInfo userData:', userData);

  // Don't render if not visible
  if (!visible) return null;

  return (
    <Html position={[position[0], position[1] + 20, position[2]]} center>
      <animated.div
        style={{
          opacity: opacity.to(o => o),
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          padding: '12px',
          borderRadius: '4px',
          width: '220px',
          fontFamily: 'Roboto Mono, monospace',
          pointerEvents: 'none',
          transform: 'scale(0.6)',
          transformOrigin: 'center center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          border: 'none'
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#000', fontWeight: 600 }}>
          Building Information
        </h3>
        <div style={{ fontSize: '12px', marginBottom: '5px', color: '#444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Height:</span>
            <span style={{ fontWeight: 500 }}>{buildingHeight}</span>
          </div>
          {userData.address && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Address:</span>
              <span style={{ fontWeight: 500 }}>{userData.address}</span>
            </div>
          )}

          <div style={{ marginTop: '10px', fontSize: '12px', color: '#444' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600 }}>Additional Information</span>
              <span>▼</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Type:</span>
              <span style={{ fontWeight: 500 }}>{buildingType}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Levels:</span>
              <span style={{ fontWeight: 500 }}>{buildingLevels}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Year Built:</span>
              <span style={{ fontWeight: 500 }}>{buildingYear}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Usage:</span>
              <span style={{ fontWeight: 500 }}>{buildingUse}</span>
            </div>

            {assessedValue && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Value:</span>
                <span style={{ fontWeight: 500 }}>{assessedValue}</span>
              </div>
            )}

            {zoning && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Zoning:</span>
                <span style={{ fontWeight: 500 }}>{zoning}</span>
              </div>
            )}

            {isLoading && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#555' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                  <LoaderIcon className="animate-spin" style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                  <div style={{ fontWeight: 600, color: '#3b82f6' }}>Loading AI Summary...</div>
                </div>
              </div>
            )}

            {!isLoading && summary && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#555' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '16px' }}>AI Summary</div>
                <div style={{ lineHeight: '1.6' }}>{summary}</div>
              </div>
            )}
          </div>
        </div>
      </animated.div>
    </Html>
  );
}
