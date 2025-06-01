// components/LengthToggle.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LengthToggleProps {
  length: string;
  selected: boolean;
  onSelect: () => void;
}

export default function LengthToggle({ length, selected, onSelect }: LengthToggleProps) {
  return (
    <TouchableOpacity style={[styles.button, selected && styles.selected]} onPress={onSelect}>
      <Text style={styles.text}>{length}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  selected: { borderColor: '#6200EE', backgroundColor: '#F3E5F5' },
  text: { textAlign: 'center', fontSize: 14 },
});