// components/AvatarWithAura.tsx
import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AvatarWithAuraProps {
  auraScore: number;
}

export default function AvatarWithAura({ auraScore }: AvatarWithAuraProps) {
  const glowOpacity = useSharedValue(0);
  const trailOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  useEffect(() => {
    // Update animation states based on auraScore
    if (auraScore <= 20) {
      glowOpacity.value = withSpring(0);
      trailOpacity.value = withSpring(0);
      particleOpacity.value = withSpring(0);
    } else if (auraScore <= 50) {
      glowOpacity.value = withSpring(0.5);
      trailOpacity.value = withSpring(0);
      particleOpacity.value = withSpring(0);
    } else if (auraScore <= 80) {
      glowOpacity.value = withSpring(1);
      trailOpacity.value = withSpring(1);
      particleOpacity.value = withSpring(0);
    } else {
      glowOpacity.value = withSpring(1);
      trailOpacity.value = withSpring(1);
      particleOpacity.value = withSpring(1);
    }
  }, [auraScore, glowOpacity, trailOpacity, particleOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowColor: '#FFD700',
    shadowOpacity: glowOpacity.value,
    shadowRadius: 10,
    elevation: 5,
  }));

  const trailStyle = useAnimatedStyle(() => ({
    opacity: trailOpacity.value,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    height: 100,
    width: 100,
    borderRadius: 50,
    position: 'absolute',
  }));

  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
  }));

  return (
    <View style={styles.avatarContainer}>
      <Animated.View style={[styles.trail, trailStyle]} />
      <Image
        source={require('../assets/avatar-base.png')}
        style={[styles.avatar, auraScore >= 100 && styles.fadedAvatar]}
      />
      <Animated.View style={[styles.glow, glowStyle]} />
      {auraScore > 80 && (
        <Animated.View style={[styles.particles, particleStyle]}>
          <Text style={styles.particle}>✨</Text>
          <Text style={[styles.particle, { top: 20, left: -20 }]}>✨</Text>
          <Text style={[styles.particle, { top: -10, left: 30 }]}>✨</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  fadedAvatar: {
    opacity: 0.5,
    tintColor: 'gray',
  },
  glow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  trail: {
    transform: [{ scale: 1.2 }],
  },
  particles: {
    position: 'absolute',
  },
  particle: {
    fontSize: 20,
    position: 'absolute',
  },
});