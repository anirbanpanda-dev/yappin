// components/UploadButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface UploadButtonProps {
  title: string;
  onPress: () => void;
}

export default function UploadButton({ title, onPress }: UploadButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6200EE',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  text: { color: '#FFF', fontWeight: 'bold' },
});