'use client'

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WASDControlsProps {
  moveSpeed?: number
}

export function WASDControls({ moveSpeed = 200 }: WASDControlsProps) {
  const { camera } = useThree()
  const keys = useRef<{ [key: string]: boolean }>({})
  const direction = useRef(new THREE.Vector3())
  const frontVector = useRef(new THREE.Vector3())
  const sideVector = useRef(new THREE.Vector3())

  // Set up key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle WASD keys
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        keys.current[e.key.toLowerCase()] = true
      }

      // Handle Shift key for sprint
      if (e.key === 'Shift') {
        keys.current['shift'] = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        keys.current[e.key.toLowerCase()] = false
      }

      if (e.key === 'Shift') {
        keys.current['shift'] = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Update camera position on each frame
  useFrame((_, delta) => {
    // Reset movement vectors
    frontVector.current.set(0, 0, 0)
    sideVector.current.set(0, 0, 0)

    // Set movement direction based on keys pressed
    if (keys.current['w']) frontVector.current.z = -1
    if (keys.current['s']) frontVector.current.z = 1
    if (keys.current['a']) sideVector.current.x = -1
    if (keys.current['d']) sideVector.current.x = 1

    // Apply sprint multiplier if shift is pressed
    const sprintMultiplier = keys.current['shift'] ? 5 : 1

    // Calculate movement direction in world space
    direction.current.subVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(moveSpeed * sprintMultiplier * delta)
      .applyEuler(camera.rotation)

    // Only move in the XZ plane (don't change Y position)
    direction.current.y = 0

    // Move camera
    camera.position.add(direction.current)
  })

  return null
}
