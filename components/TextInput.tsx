import React, { useState } from 'react';
import { View, TextInput as RNTextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TextInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TextInput({ onSubmit, placeholder = "Type a new task...", disabled = false }: TextInputProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();
  
  const scaleAnimation = React.useRef(new Animated.Value(1)).current;

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
      setText('');
      
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isFocused ? colors.primary : colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 56,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 12,
      paddingRight: 12,
      maxHeight: 120,
      textAlignVertical: 'top',
    },
    submitButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: text.trim() ? colors.primary : colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <RNTextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.textInput}
          multiline
          maxLength={500}
          editable={!disabled}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        
        <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!text.trim() || disabled}
            style={[
              styles.submitButton,
              (!text.trim() || disabled) && styles.submitButtonDisabled
            ]}
          >
            {text.trim() ? (
              <Send size={20} color="white" />
            ) : (
              <Sparkles size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}