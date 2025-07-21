import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Check, Calendar, Edit3, Trash2, Tag, Plus } from 'lucide-react-native';
import blink from '@/lib/blink';
import { useTheme } from '@/contexts/ThemeContext';
import DatePicker from './DatePicker';
import TagManager from './TagManager';

interface Task {
  id: string;
  title: string;
  completed: string | number;
  deadline?: string;
  created_at: string;
  user_id: string;
}

interface TaskTag {
  id: string;
  name: string;
  color: string;
}

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showTagManager, setShowTagManager] = useState(false);
  const [taskTags, setTaskTags] = useState<TaskTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { colors } = useTheme();

  const isCompleted = Number(task.completed) > 0;

  useEffect(() => {
    loadTaskTags();
  }, [task.id]);

  const loadTaskTags = async () => {
    try {
      // Get task-tag associations
      const associations = await blink.db.taskTags.list({
        where: { task_id: task.id }
      });

      if (associations.length > 0) {
        // Get tag details
        const tagIds = associations.map(assoc => assoc.tag_id);
        const tags = await Promise.all(
          tagIds.map(async (tagId) => {
            try {
              const tag = await blink.db.tags.list({
                where: { id: tagId },
                limit: 1
              });
              return tag[0];
            } catch (error) {
              console.error('Error loading tag:', error);
              return null;
            }
          })
        );

        const validTags = tags.filter(tag => tag !== null);
        setTaskTags(validTags);
        setSelectedTagIds(validTags.map(tag => tag.id));
      }
    } catch (error) {
      console.error('Error loading task tags:', error);
    }
  };

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
              // Delete task-tag associations first
              const associations = await blink.db.taskTags.list({
                where: { task_id: task.id }
              });
              
              for (const assoc of associations) {
                await blink.db.taskTags.delete(assoc.id);
              }

              // Then delete the task
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

  const updateDeadline = async (date: Date | null) => {
    setIsUpdating(true);
    try {
      await blink.db.tasks.update(task.id, {
        deadline: date ? date.toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating deadline:', error);
      Alert.alert('Error', 'Failed to update deadline. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTaskTags = async (tagIds: string[]) => {
    setIsUpdating(true);
    try {
      // Remove existing associations
      const existingAssociations = await blink.db.taskTags.list({
        where: { task_id: task.id }
      });
      
      for (const assoc of existingAssociations) {
        await blink.db.taskTags.delete(assoc.id);
      }

      // Add new associations
      for (const tagId of tagIds) {
        const associationId = `task_tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await blink.db.taskTags.create({
          id: associationId,
          task_id: task.id,
          tag_id: tagId,
          created_at: new Date().toISOString(),
        });
      }

      setSelectedTagIds(tagIds);
      await loadTaskTags();
      setShowTagManager(false);
    } catch (error) {
      console.error('Error updating task tags:', error);
      Alert.alert('Error', 'Failed to update tags. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isOverdue = date < today && date.toDateString() !== today.toDateString();

    if (date.toDateString() === today.toDateString()) {
      return { text: 'Today', isOverdue: false };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', isOverdue: false };
    } else {
      return { 
        text: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        }), 
        isOverdue 
      };
    }
  };

  const deadlineInfo = task.deadline ? formatDeadline(task.deadline) : null;

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
    metaContainer: {
      marginTop: 12,
      gap: 8,
    },
    deadlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    deadlineOverdue: {
      backgroundColor: colors.error + '20',
    },
    deadlineText: {
      fontSize: 14,
      marginLeft: 4,
      fontWeight: '500',
    },
    deadlineTextNormal: {
      color: colors.warning,
    },
    deadlineTextOverdue: {
      color: colors.error,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    tagColor: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
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
    <>
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

            {/* Meta Information */}
            <View style={styles.metaContainer}>
              {/* Deadline */}
              {deadlineInfo && (
                <View style={[
                  styles.deadlineContainer,
                  deadlineInfo.isOverdue && styles.deadlineOverdue
                ]}>
                  <Calendar 
                    size={14} 
                    color={deadlineInfo.isOverdue ? colors.error : colors.warning} 
                  />
                  <Text style={[
                    styles.deadlineText,
                    deadlineInfo.isOverdue ? styles.deadlineTextOverdue : styles.deadlineTextNormal
                  ]}>
                    {deadlineInfo.text}
                  </Text>
                </View>
              )}

              {/* Tags */}
              {taskTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {taskTags.map((tag) => (
                    <View key={tag.id} style={styles.tagChip}>
                      <View 
                        style={[styles.tagColor, { backgroundColor: tag.color }]} 
                      />
                      <Text style={styles.tagText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

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

                <DatePicker
                  value={task.deadline ? new Date(task.deadline) : undefined}
                  onDateChange={updateDeadline}
                  placeholder="Deadline"
                  disabled={isUpdating}
                />

                <TouchableOpacity
                  onPress={() => setShowTagManager(true)}
                  disabled={isUpdating}
                  style={styles.actionButton}
                >
                  <Tag size={16} color={colors.textSecondary} />
                  <Text style={styles.actionText}>Tags</Text>
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



      {/* Tag Manager Modal */}
      <TagManager
        visible={showTagManager}
        onClose={() => setShowTagManager(false)}
        selectedTags={selectedTagIds}
        onTagsChange={updateTaskTags}
        mode="select"
      />
    </>
  );
}