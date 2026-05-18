import { StyleSheet, Text, View } from 'react-native';

type Props = {
  sourceName: string;
};

export function SourceAttribution({ sourceName }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Source: {sourceName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});
