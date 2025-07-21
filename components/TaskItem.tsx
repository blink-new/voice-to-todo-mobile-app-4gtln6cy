import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Check, Calendar, Edit3, Trash2 } from 'lucide-react-native';
import blink from '@/lib/blink';
import { useTheme } from '@/contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  completed: string | number;
  deadline?: string;
  created_at: string;
}

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const { colors } = useTheme();

  const isCompleted = Number(task.completed) > 0;

  const toggleComplete = async () => {
    setIsUpdating(true);
    try {
      await blink.db.tasks.update(task.id, {
        completed: isCompleted ? "0" : "1",
        updated_at: new Date().toISOString(),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Task title cannot be empty.');
      return;
    }

    setIsUpdating(true);
    try {
      await blink.db.tasks.update(task.id, {
        title: editText.trim(),
        updated_at: new Date().toISOString(),
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteTask = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await blink.db.tasks.delete(task.id);
              onUpdate();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const setDeadline = () => {
    // For now, we'll set a simple deadline (tomorrow)
    // In a full implementation, you'd use a date picker
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    Alert.alert(
      'Set Deadline',
      'Set deadline for tomorrow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await blink.db.tasks.update(task.id, {
                deadline: tomorrow.toISOString(),
                updated_at: new Date().toISOString(),
              });
              onUpdate();
            } catch (error) {
              console.error('Error setting deadline:', error);
              Alert.alert('Error', 'Failed to set deadline. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    containerDisabled: {
      opacity: 0.5,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      marginRight: 16,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxCompleted: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxUncompleted: {
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    taskContent: {
      flex: 1,
    },
    textInput: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      padding: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    taskTitle: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      fontWeight: '500',
    },
    taskTitleCompleted: {
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    deadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    deadlineText: {
      color: colors.warning,
      fontSize: 14,
      marginLeft: 4,
      fontWeight: '500',
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    actionText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginLeft: 6,
      fontWeight: '500',
    },
    actionTextDelete: {
      color: colors.error,
      fontSize: 14,
      marginLeft: 6,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.container, isUpdating && styles.containerDisabled]}>
      <View style={styles.content}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={toggleComplete}
          disabled={isUpdating}
          style={[
            styles.checkbox,
            isCompleted ? styles.checkboxCompleted : styles.checkboxUncompleted
          ]}
        >
          {isCompleted && <Check size={18} color="white" />}
        </TouchableOpacity>

        {/* Task Content */}
        <View style={styles.taskContent}>
          {isEditing ? (
            <View>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                onBlur={saveEdit}
                onSubmitEditing={saveEdit}
                autoFocus
                multiline
                style={styles.textInput}
                placeholder="Enter task..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text 
                style={[
                  styles.taskTitle,
                  isCompleted && styles.taskTitleCompleted
                ]}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
          )}

          {/* Deadline */}
          {task.deadline && (
            <View style={styles.deadlineContainer}>
              <Calendar size={14} color={colors.warning} />
              <Text style={styles.deadlineText}>
                {formatDeadline(task.deadline)}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {!isEditing && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                disabled={isUpdating}
                style={styles.actionButton}
              >
                <Edit3 size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={setDeadline}
                disabled={isUpdating}
                style={styles.actionButton}
              >
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>Deadline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deleteTask}
                disabled={isUpdating}
                style={styles.actionButton}
              >
                <Trash2 size={16} color={colors.error} />
                <Text style={styles.actionTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

