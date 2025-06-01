// components/MoodToggle.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface MoodToggleProps {
  mood: string;
  selected: boolean;
  onSelect: () => void;
}

export default function MoodToggle({ mood, selected, onSelect }: MoodToggleProps) {
  return (
    <TouchableOpacity style={[styles.button, selected && styles.selected]} onPress={onSelect}>
      <Text style={styles.text}>{mood}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    marginRight: 10, // Adjusted for horizontal scrolling
    minWidth: 120, // Ensure buttons are wide enough
  },
  selected: { borderColor: '#6200EE', backgroundColor: '#F3E5F5' },
  text: { textAlign: 'center', fontSize: 14 },
});