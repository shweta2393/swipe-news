import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { saveOnboardingTopics } from '@/lib/api';
import { ONBOARDING_TOPICS } from '@/lib/types';

const MAX_TOPICS = 3;

export default function OnboardingTopicsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= MAX_TOPICS) {
        Alert.alert('Limit reached', `Pick up to ${MAX_TOPICS} topics`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const finish = async () => {
    setLoading(true);
    try {
      await saveOnboardingTopics(selected);
      router.replace('/(tabs)/feed');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What interests you?</Text>
      <Text style={styles.subtitle}>
        Pick up to {MAX_TOPICS} topics to seed your feed (optional)
      </Text>

      <View style={styles.chips}>
        {ONBOARDING_TOPICS.map((t) => {
          const active = selected.includes(t.id);
          return (
            <Pressable
              key={t.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggle(t.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.button} onPress={finish} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {selected.length ? 'Continue' : 'Skip for now'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 28,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
