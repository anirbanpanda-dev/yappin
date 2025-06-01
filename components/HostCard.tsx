// components/HostCard.tsx
import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

interface HostCardProps {
  name: string;
  image: any;
  selected: boolean;
  onSelect: () => void;
}

export default function HostCard({ name, image, selected, onSelect }: HostCardProps) {
  return (
    <TouchableOpacity style={[styles.card, selected && styles.selected]} onPress={onSelect}>
      <Image source={image} style={styles.image} />
      <Text style={styles.name}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginRight: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selected: { borderColor: '#6200EE', borderWidth: 2 },
  image: { width: 60, height: 60, borderRadius: 30, marginBottom: 5 },
  name: { fontSize: 14, fontWeight: 'bold' },
});