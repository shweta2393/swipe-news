import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
};

export function SwipeControls({ onPass, onLike, disabled }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.action}>
        <Pressable
          style={[styles.button, styles.passButton]}
          onPress={onPass}
          disabled={disabled}
          accessibilityLabel="Not interested"
        >
          <FontAwesome name="times" size={28} color="#dc2626" />
        </Pressable>
        <Text style={[styles.label, styles.passLabel]}>Not interested</Text>
      </View>

      <View style={styles.action}>
        <Pressable
          style={[styles.button, styles.likeButton]}
          onPress={onLike}
          disabled={disabled}
          accessibilityLabel="Interested"
        >
          <FontAwesome name="heart" size={26} color="#16a34a" />
        </Pressable>
        <Text style={[styles.label, styles.likeLabel]}>Interested</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#f1f5f9',
  },
  action: {
    alignItems: 'center',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
  },
  passButton: {
    borderColor: '#fecaca',
  },
  likeButton: {
    borderColor: '#bbf7d0',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  passLabel: {
    color: '#dc2626',
  },
  likeLabel: {
    color: '#16a34a',
  },
});
