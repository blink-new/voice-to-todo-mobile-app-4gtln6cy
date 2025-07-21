import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Clock, Target } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TaskStatsProps {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function TaskStats({ totalTasks, completedTasks, pendingTasks }: TaskStatsProps) {
  const { colors } = useTheme();
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginHorizontal: 24,
      marginBottom: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    completionCard: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary + '30',
    },
    completedCard: {
      backgroundColor: colors.success + '15',
      borderColor: colors.success + '30',
    },
    pendingCard: {
      backgroundColor: colors.warning + '15',
      borderColor: colors.warning + '30',
    },
  });

  if (totalTasks === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.statCard, styles.completionCard]}>
        <View style={styles.statIcon}>
          <Target size={24} color={colors.primary} />
        </View>
        <Text style={styles.statValue}>{completionRate}%</Text>
        <Text style={styles.statLabel}>Completion</Text>
      </View>
      
      <View style={[styles.statCard, styles.completedCard]}>
        <View style={styles.statIcon}>
          <CheckCircle size={24} color={colors.success} />
        </View>
        <Text style={styles.statValue}>{completedTasks}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      
      <View style={[styles.statCard, styles.pendingCard]}>
        <View style={styles.statIcon}>
          <Clock size={24} color={colors.warning} />
        </View>
        <Text style={styles.statValue}>{pendingTasks}</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
    </View>
  );
}