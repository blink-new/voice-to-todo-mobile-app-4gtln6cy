import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Mic, Type } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type InputMode = 'voice' | 'text';

interface InputToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export default function InputToggle({ mode, onModeChange }: InputToggleProps) {
  const { colors } = useTheme();
  const slideAnimation = React.useRef(new Animated.Value(mode === 'voice' ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: mode === 'voice' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [mode]);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 4,
      borderWidth: 2,
      borderColor: colors.border,
      position: 'relative',
      overflow: 'hidden',
    },
    slider: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      width: '50%',
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      zIndex: 1,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    activeText: {
      color: 'white',
    },
    inactiveText: {
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.slider,
          {
            left: slideAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [4, '50%'],
            }),
          },
        ]}
      />
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => onModeChange('voice')}
      >
        <Mic size={20} color={mode === 'voice' ? 'white' : colors.textSecondary} />
        <Text style={[styles.buttonText, mode === 'voice' ? styles.activeText : styles.inactiveText]}>
          Voice
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => onModeChange('text')}
      >
        <Type size={20} color={mode === 'text' ? 'white' : colors.textSecondary} />
        <Text style={[styles.buttonText, mode === 'text' ? styles.activeText : styles.inactiveText]}>
          Text
        </Text>
      </TouchableOpacity>
    </View>
  );
}