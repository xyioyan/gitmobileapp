import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/src/constants/theme';


export const PrimaryButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.button} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});