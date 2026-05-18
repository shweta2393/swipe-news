import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <Pressable
        style={styles.menuRow}
        onPress={() => router.push('/saved' as never)}
      >
        <FontAwesome name="bookmark" size={20} color="#3b82f6" />
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>Saved articles</Text>
          <Text style={styles.menuSubtitle}>View and remove bookmarks</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Swipe News</Text>
        <Text style={styles.body}>
          Swipe right on stories you like and left on ones you do not. After 20 swipes,
          your feed personalizes based on topics and sources you prefer.
        </Text>
        <Text style={styles.body}>
          Each card shows a short summary. Tap to read the full article at the original
          publisher. Long-press for save, share, or “show less like this.”
        </Text>
        <Text style={styles.body}>
          We link out to publishers — we do not host full article text or bypass paywalls.
          Summaries are generated from headlines and descriptions only, not from your swipe
          history.
        </Text>
        <Text style={styles.attribution}>
          News headlines provided by NewsAPI.org. Always verify stories at the source.
        </Text>
      </View>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    color: '#64748b',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuText: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 10,
    color: '#111827',
  },
  body: {
    color: '#475569',
    lineHeight: 22,
    marginBottom: 10,
    fontSize: 14,
  },
  attribution: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
