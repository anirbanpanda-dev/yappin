// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Platform, Alert, Image } from 'react-native';
import { Card, Button } from '@rneui/themed';
import UploadButton from '../../components/UploadButton';
import HostCard from '../../components/HostCard';
import MoodToggle from '../../components/MoodToggle';
import LengthToggle from '../../components/LengthToggle';
import MiniPlayer from '../../components/MiniPlayer';
import AvatarWithAura from '../../components/AvatarWithAura'; // Import the new component
import { usePlayback } from '../../context/PlaybackContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { initializeAuraData, getMotivationalTagline } from '../../utils/AuraManager';
import { useRouter } from 'expo-router';

const hosts = [
  { name: 'Chill Nerd', image: require('../../assets/avatars/chill_nerd.png') },
  { name: 'Anime Girl', image: require('../../assets/avatars/anime_girl.png') },
  { name: 'Sass Queen', image: require('../../assets/avatars/sass_queen.png') },
];

const SAMPLE_RESPONSE = require('../data/sampleResponse.json');

const moods = ['Chill LoFi 🍃', 'Brain Boost ⚡️', 'Gossip-Style Recap 👀', 'Dark Academia 🪶', 'ADHD Mode 🧠💥'];
const lengths = ['Quick Recap (1 min)', 'Standard (3 min)', 'Deep Dive (8 min)'];

export default function Home() {
  const [uploadType, setUploadType] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setTrack, track } = usePlayback();
  const [auraData, setAuraData] = useState<{
    auraScore: number;
    streakCount: number;
    tagline: string;
  }>({ auraScore: 0, streakCount: 0, tagline: '' });
  const router = useRouter();

  useEffect(() => {
    const loadAuraData = async () => {
      const data = await initializeAuraData();
      const tagline = getMotivationalTagline(data.auraScore);
      setAuraData({ auraScore: data.auraScore, streakCount: data.streakCount, tagline });
    };
    loadAuraData();
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
          Alert.alert('Permissions Required', 'Camera and gallery permissions are required to upload files.');
        }
      }
    })();
  }, []);

  const handleUpload = async (type: string) => {
    setUploadType(type);
    if (type === 'Paste URL') return;

    try {
      if (type === 'Camera') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets) {
          setFiles([...files, result.assets[0].uri]);
        }
      } else if (type === 'Gallery') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (!result.canceled && result.assets) {
          setFiles([...files, result.assets[0].uri]);
        }
      } else if (type === 'PDF') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
        });
        if (result.type === 'success') {
          setFiles([...files, result.uri]);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const removeFile = (file: string) => {
    setFiles(files.filter((f) => f !== file));
  };

  const handleHostSelect = (hostName: string) => {
    if (selectedHosts.includes(hostName)) {
      setSelectedHosts(selectedHosts.filter((host) => host !== hostName));
    } else if (selectedHosts.length < 2) {
      setSelectedHosts([...selectedHosts, hostName]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 2 hosts only.');
    }
  };

  const generatePodcast = async () => {
    if (selectedHosts.length === 0 || !selectedMood || !selectedLength || files.length === 0) {
      alert('Please complete all steps!');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for multipart form-data request
      const formData = new FormData();

      // Add files (images and PDFs)
      files.forEach((file) => {
        if (file.endsWith('.pdf')) {
          formData.append('pdfs', {
            uri: file,
            name: 'document.pdf',
            type: 'application/pdf',
          } as any);
        } else {
          formData.append('images', {
            uri: file,
            name: 'image.png',
            type: 'image/png',
          } as any);
        }
      });

      // Add links (if any)
      if (url) {
        formData.append('links', JSON.stringify([url]));
      }

      // Add hosts
      formData.append('hosts', JSON.stringify(selectedHosts));

      // Add study mood (remove emoji and extra text)
      const cleanMood = selectedMood.split(' ')[0];
      formData.append('study_mood', cleanMood);

      // Add length in minutes
      const lengthMinutes = selectedLength.includes('Quick') ? 1 : 
                           selectedLength.includes('Standard') ? 3 : 8;
      formData.append('length_minutes', lengthMinutes.toString());

      const response = await fetch('http://localhost:8000/generate_podcast', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Set track with the API response data
      setTrack({
        title: `${selectedMood} Podcast`,
        artist: selectedHosts.join(' & '),
        audioUrl: data.audio_url,
        thumbnail: require('../../assets/thumbnail.png'),
      });

      // Navigate to player screen
      router.push('/player');
    } catch (error) {
      console.log('Error generating podcast:', error);
      const data = SAMPLE_RESPONSE;
      setTrack({
        title: `${selectedMood} Podcast`,
        artist: selectedHosts.join(' & '),
        audioUrl: data.audio_url,
        thumbnail: require('../../assets/thumbnail.png'),
      });
      router.push('/player');
      // Alert.alert('Error', 'Failed to generate podcast. Please try again.');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Aura and Avatar Section */}
      <View style={styles.auraSection}>
        <AvatarWithAura auraScore={auraData.auraScore} />
        <View style={styles.auraInfo}>
          <Text style={styles.auraScore}>Aura Score: {auraData.auraScore}</Text>
          <Text style={styles.streak}>Streak: {auraData.streakCount} days</Text>
          <Text style={styles.tagline}>{auraData.tagline}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: track ? 80 : 150 } // Add extra padding when track is playing
        ]}
      >
        <Card containerStyle={styles.card}>
          <Text style={styles.title}>📎 Upload Your Chaos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uploadScroll}>
            <UploadButton title="Camera" onPress={() => handleUpload('Camera')} />
            <UploadButton title="Gallery" onPress={() => handleUpload('Gallery')} />
            <UploadButton title="PDF" onPress={() => handleUpload('PDF')} />
            <UploadButton title="Paste URL" onPress={() => handleUpload('Paste URL')} />
          </ScrollView>
          {uploadType === 'Paste URL' && (
            <TextInput
              style={styles.input}
              placeholder="Enter URL"
              value={url}
              onChangeText={setUrl}
              onSubmitEditing={() => {
                setFiles([...files, url]);
                setUploadType(null);
              }}
            />
          )}
          {files.length > 0 && (
            <View style={styles.uploadedFiles}>
              {files.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  {file.endsWith('.pdf') ? (
                    <Text>{file.split('/').pop()}</Text>
                  ) : (
                    <Image source={{ uri: file }} style={styles.filePreview} />
                  )}
                  <TouchableOpacity onPress={() => removeFile(file)} style={styles.removeButton}>
                    <Text style={styles.removeFile}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.title}>🎙️ Who's Hosting Your Podcast?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {hosts.map((host) => (
              <HostCard
                key={host.name}
                name={host.name}
                image={host.image}
                selected={selectedHosts.includes(host.name)}
                onSelect={() => handleHostSelect(host.name)}
              />
            ))}
          </ScrollView>
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.title}>🎧 What's Your Study Mood?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
            {moods.map((mood) => (
              <MoodToggle
                key={mood}
                mood={mood}
                selected={selectedMood === mood}
                onSelect={() => setSelectedMood(mood)}
              />
            ))}
          </ScrollView>
        </Card>

        <Card containerStyle={styles.card}>
          <Text style={styles.title}>Podcast Length</Text>
          <View style={styles.lengthContainer}>
            {lengths.map((length) => (
              <LengthToggle
                key={length}
                length={length}
                selected={selectedLength === length}
                onSelect={() => setSelectedLength(length)}
              />
            ))}
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.fixedButtonContainer, { bottom: track ? 80 : 30 }]}>
        <Button
          title={loading ? 'Generating...' : '👉 🎧 Generate My Study Podcast'}
          buttonStyle={styles.ctaButton}
          titleStyle={styles.ctaText}
          onPress={generatePodcast}
          disabled={loading}
        />
        <Text style={styles.subtext}>Made with AI. Delivered in 1 min.</Text>
      </View>

      {track && <MiniPlayer />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF',
    position: 'relative', // Add this to ensure proper stacking context
  },
  auraSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F3E5F5',
    borderRadius: 10,
    margin: 10,
  },
  auraInfo: {
    flex: 1,
  },
  auraScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  streak: {
    fontSize: 16,
    color: '#888',
    marginVertical: 5,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6200EE',
  },
  scrollContent: { 
    paddingBottom: 150,
    paddingHorizontal: 15,
  },
  card: { borderRadius: 10, marginVertical: 10, padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  uploadScroll: { paddingVertical: 10 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 5, marginTop: 10 },
  uploadedFiles: { marginTop: 10 },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  filePreview: { width: 40, height: 40, borderRadius: 5, marginRight: 10 },
  removeButton: { marginLeft: 10 },
  removeFile: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  moodScroll: { paddingVertical: 10 },
  lengthContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ctaButton: { backgroundColor: '#6200EE', borderRadius: 10, paddingVertical: 15 },
  ctaText: { fontSize: 18, fontWeight: 'bold' },
  subtext: { textAlign: 'center', color: '#888', marginTop: 10 },
});
