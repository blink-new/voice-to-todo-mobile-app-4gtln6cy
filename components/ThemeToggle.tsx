import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useTheme, Theme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, colors, isDark } = useTheme();

  const themes: { key: Theme; label: string; icon: React.ReactNode }[] = [
    { key: 'light', label: 'Light', icon: <Sun size={18} color={colors.text} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={18} color={colors.text} /> },
    { key: 'system', label: 'Auto', icon: <Monitor size={18} color={colors.text} /> },
  ];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      minHeight: 36,
    },
    activeThemeButton: {
      backgroundColor: colors.primary,
    },
    themeText: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 6,
      color: colors.text,
    },
    activeThemeText: {
      color: 'white',
    },
  });

  return (
    <View style={styles.container}>
      {themes.map((themeOption) => (
        <TouchableOpacity
          key={themeOption.key}
          onPress={() => setTheme(themeOption.key)}
          style={[
            styles.themeButton,
            theme === themeOption.key && styles.activeThemeButton,
          ]}
        >
          {React.cloneElement(themeOption.icon as React.ReactElement, {
            color: theme === themeOption.key ? 'white' : colors.text,
          })}
          <Text
            style={[
              styles.themeText,
              theme === themeOption.key && styles.activeThemeText,
            ]}
          >
            {themeOption.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}