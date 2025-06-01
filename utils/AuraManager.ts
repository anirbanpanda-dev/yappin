// utils/AuraManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInDays, parseISO } from 'date-fns';

interface AuraData {
  auraScore: number;
  lastOpenedDate: string;
  streakCount: number;
  consecutiveMissedDays: number;
}

interface EpisodeHistory {
  episodeName: string;
  host: string;
  auraScore: number;
  moodReaction: string;
  timestamp: string;
}

const AURA_STORAGE_KEY = 'VibeCastAuraData';
const HISTORY_STORAGE_KEY = 'VibeCastEpisodeHistory';

export const initializeAuraData = async (): Promise<AuraData> => {
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  try {
    const storedData = await AsyncStorage.getItem(AURA_STORAGE_KEY);
    if (storedData) {
      const data: AuraData = JSON.parse(storedData);
      const lastOpened = parseISO(data.lastOpenedDate);
      const daysSinceLastOpened = differenceInDays(today, lastOpened);

      if (daysSinceLastOpened === 0) {
        return data;
      } else if (daysSinceLastOpened === 1) {
        const newStreak = data.streakCount + 1;
        const newAuraScore = Math.min(data.auraScore + 1, 100);
        const newData = {
          ...data,
          auraScore: newAuraScore,
          lastOpenedDate: todayString,
          streakCount: newStreak,
          consecutiveMissedDays: 0,
        };
        await AsyncStorage.setItem(AURA_STORAGE_KEY, JSON.stringify(newData));
        return newData;
      } else {
        const newConsecutiveMissedDays = data.consecutiveMissedDays + daysSinceLastOpened;
        let newAuraScore = data.auraScore - 5 * daysSinceLastOpened;
        let newStreak = 0;

        if (newConsecutiveMissedDays >= 3) {
          newAuraScore = 0;
          newStreak = 0;
        }

        newAuraScore = Math.max(newAuraScore, 0);
        const newData = {
          auraScore: newAuraScore,
          lastOpenedDate: todayString,
          streakCount: newStreak,
          consecutiveMissedDays: newConsecutiveMissedDays >= 3 ? 0 : newConsecutiveMissedDays,
        };
        await AsyncStorage.setItem(AURA_STORAGE_KEY, JSON.stringify(newData));
        return newData;
      }
    } else {
      const initialData: AuraData = {
        auraScore: 0,
        lastOpenedDate: todayString,
        streakCount: 0,
        consecutiveMissedDays: 0,
      };
      await AsyncStorage.setItem(AURA_STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
  } catch (error) {
    console.error('Error initializing aura data:', error);
    return {
      auraScore: 0,
      lastOpenedDate: todayString,
      streakCount: 0,
      consecutiveMissedDays: 0,
    };
  }
};

export const getMotivationalTagline = (auraScore: number): string => {
  if (auraScore <= 20) return 'Your vibe’s fading… come back soon';
  if (auraScore <= 50) return 'A small glow! Keep going.';
  if (auraScore <= 80) return 'You’re glowing! Keep it up.';
  return 'Aura Maxxed — You’re on fire 🔥';
};

export const getAuraColor = (auraScore: number): string => {
  if (auraScore <= 20) return '#FF5555'; // Red
  if (auraScore <= 50) return '#FFD700'; // Yellow
  if (auraScore <= 80) return '#55AAFF'; // Blue
  return '#FF66FF'; // Neon
};

export const getVibeLabel = (auraScore: number): string => {
  if (auraScore <= 20) return 'Low Energy';
  if (auraScore <= 50) return 'Growing Vibe';
  if (auraScore <= 80) return 'Balanced Energy';
  return 'Max Aura';
};

export const getMotivationalQuote = (auraScore: number, host: string): string => {
  if (auraScore <= 20) return `${host} says: "Hey, let’s recharge your vibe! 🔋"`;
  if (auraScore <= 50) return `${host} says: "You’re starting to glow—keep it up! ✨"`;
  if (auraScore <= 80) return `${host} says: "Today’s vibe is brain fuel 💡"`;
  return `${host} says: "You’re absolutely slaying it! 🔥"`;
};

export const saveEpisodeReaction = async (episode: EpisodeHistory) => {
  try {
    const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    const history: EpisodeHistory[] = storedHistory ? JSON.parse(storedHistory) : [];
    history.push(episode);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving episode reaction:', error);
  }
};