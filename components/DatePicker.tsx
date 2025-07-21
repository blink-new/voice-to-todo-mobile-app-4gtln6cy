import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DatePickerProps {
  value?: Date;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function DatePicker({ 
  value, 
  onDateChange, 
  placeholder = "Set deadline",
  disabled = false 
}: DatePickerProps) {
  const { colors } = useTheme();

  const handleDateSelect = () => {
    if (disabled) return;

    Alert.alert(
      'Set Deadline',
      'Choose when this task should be completed:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Today',
          onPress: () => {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            onDateChange(today);
          }
        },
        {
          text: 'Tomorrow',
          onPress: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999);
            onDateChange(tomorrow);
          }
        },
        {
          text: 'Next Week',
          onPress: () => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(23, 59, 59, 999);
            onDateChange(nextWeek);
          }
        },
        ...(value ? [{
          text: 'Remove',
          style: 'destructive' as const,
          onPress: () => onDateChange(null)
        }] : [])
      ]
    );
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: value ? colors.primary + '20' : colors.surface,
      borderWidth: 1,
      borderColor: value ? colors.primary : colors.border,
    },
    buttonText: {
      color: value ? colors.primary : colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 6,
    },
    clearButton: {
      marginLeft: 8,
      padding: 4,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleDateSelect}
        disabled={disabled}
        style={styles.button}
      >
        <Calendar size={16} color={value ? colors.primary : colors.textSecondary} />
        <Text style={styles.buttonText}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {value && (
        <TouchableOpacity onPress={() => onDateChange(null)} style={styles.clearButton}>
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}