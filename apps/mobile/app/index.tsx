import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { getProfile } from '@/lib/api';

export default function IndexScreen() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    (async () => {
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      try {
        const profile = await getProfile();
        if (profile?.onboarding_topics === null) {
          router.replace('/onboarding/topics');
        } else {
          router.replace('/(tabs)/feed');
        }
      } catch {
        router.replace('/(tabs)/feed');
      }
    })();
  }, [session, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
});
