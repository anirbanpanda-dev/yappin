// app/(tabs)/history.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MiniPlayer from '../../components/MiniPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EpisodeHistory {
  episodeName: string;
  host: string;
  auraScore: number;
  moodReaction: string;
  timestamp: string;
}

export default function History() {
  const [history, setHistory] = useState<EpisodeHistory[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const storedHistory = await AsyncStorage.getItem('VibeCastEpisodeHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    };
    loadHistory();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>History</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>No podcast history yet.</Text>
        ) : (
          history.map((episode, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.episodeName}>{episode.episodeName}</Text>
              <Text style={styles.host}>Hosted by: {episode.host}</Text>
              <Text style={styles.auraScore}>Aura Score: {episode.auraScore}</Text>
              <Text style={styles.moodReaction}>You felt: {episode.moodReaction}</Text>
              <Text style={styles.timestamp}>
                {new Date(episode.timestamp).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', margin: 20, textAlign: 'center' },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 16 },
  historyItem: {
    backgroundColor: '#F3E5F5',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  episodeName: { fontSize: 18, fontWeight: 'bold', color: '#6200EE' },
  host: { fontSize: 16, color: '#888', marginVertical: 5 },
  auraScore: { fontSize: 14, color: '#6200EE' },
  moodReaction: { fontSize: 14, color: '#6200EE' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 5 },
});