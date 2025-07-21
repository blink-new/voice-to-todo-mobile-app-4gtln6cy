import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  StyleSheet,
  Modal 
} from 'react-native';
import { Plus, X, Tag, Edit3, Trash2 } from 'lucide-react-native';
import blink from '@/lib/blink';
import { useTheme } from '@/contexts/ThemeContext';

interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface TagManagerProps {
  visible: boolean;
  onClose: () => void;
  selectedTags?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  mode?: 'manage' | 'select';
}

const TAG_COLORS = [
  '#6366F1', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6B7280', '#14B8A6', '#F43F5E'
];

export default function TagManager({ 
  visible, 
  onClose, 
  selectedTags = [], 
  onTagsChange,
  mode = 'manage' 
}: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [user, setUser] = useState<any>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user && visible) {
        loadTags();
      }
    });
    return unsubscribe;
  }, [visible]);

  useEffect(() => {
    if (visible && user) {
      loadTags();
    }
  }, [visible, user]);

  const loadTags = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userTags = await blink.db.tags.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });
      setTags(userTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim() || !user) return;

    try {
      const newTag = {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newTagName.trim(),
        color: newTagColor,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await blink.db.tags.create(newTag);
      await loadTags();
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'Failed to create tag');
    }
  };

  const updateTag = async (tag: Tag) => {
    try {
      await blink.db.tags.update(tag.id, {
        name: tag.name,
        color: tag.color,
        updated_at: new Date().toISOString(),
      });
      await loadTags();
      setEditingTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
      Alert.alert('Error', 'Failed to update tag');
    }
  };

  const deleteTag = async (tagId: string) => {
    Alert.alert(
      'Delete Tag',
      'Are you sure? This will remove the tag from all tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete tag associations first
              await blink.db.taskTags.list({
                where: { tag_id: tagId }
              }).then(async (associations) => {
                for (const assoc of associations) {
                  await blink.db.taskTags.delete(assoc.id);
                }
              });
              
              // Then delete the tag
              await blink.db.tags.delete(tagId);
              await loadTags();
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert('Error', 'Failed to delete tag');
            }
          },
        },
      ]
    );
  };

  const toggleTagSelection = (tagId: string) => {
    if (mode !== 'select' || !onTagsChange) return;
    
    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onTagsChange(newSelection);
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: 50,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    createButtonText: {
      color: 'white',
      fontWeight: '600',
      marginLeft: 8,
    },
    createForm: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 12,
    },
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedColor: {
      borderColor: colors.text,
      borderWidth: 3,
    },
    formButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    formButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: 'white',
    },
    tagsList: {
      flex: 1,
    },
    tagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedTagItem: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    tagColor: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: 12,
    },
    tagContent: {
      flex: 1,
    },
    tagName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    tagActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'select' ? 'Select Tags' : 'Manage Tags'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {mode === 'manage' && (
              <>
                {!showCreateForm ? (
                  <TouchableOpacity
                    onPress={() => setShowCreateForm(true)}
                    style={styles.createButton}
                  >
                    <Plus size={20} color="white" />
                    <Text style={styles.createButtonText}>Create New Tag</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.createForm}>
                    <TextInput
                      value={newTagName}
                      onChangeText={setNewTagName}
                      placeholder="Tag name"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                      autoFocus
                    />
                    
                    <View style={styles.colorPicker}>
                      {TAG_COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          onPress={() => setNewTagColor(color)}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            newTagColor === color && styles.selectedColor,
                          ]}
                        />
                      ))}
                    </View>

                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowCreateForm(false);
                          setNewTagName('');
                          setNewTagColor(TAG_COLORS[0]);
                        }}
                        style={[styles.formButton, styles.cancelButton]}
                      >
                        <Text style={[styles.buttonText, styles.cancelButtonText]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={createTag}
                        disabled={!newTagName.trim()}
                        style={[
                          styles.formButton, 
                          styles.saveButton,
                          !newTagName.trim() && { opacity: 0.5 }
                        ]}
                      >
                        <Text style={[styles.buttonText, styles.saveButtonText]}>
                          Create
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={false}>
              {tags.length === 0 ? (
                <View style={styles.emptyState}>
                  <Tag size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>
                    {mode === 'select' 
                      ? 'No tags available.\nCreate some tags first.' 
                      : 'No tags yet.\nCreate your first tag to organize tasks.'
                    }
                  </Text>
                </View>
              ) : (
                tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => mode === 'select' && toggleTagSelection(tag.id)}
                    style={[
                      styles.tagItem,
                      mode === 'select' && selectedTags.includes(tag.id) && styles.selectedTagItem,
                    ]}
                  >
                    <View style={[styles.tagColor, { backgroundColor: tag.color }]} />
                    
                    <View style={styles.tagContent}>
                      {editingTag?.id === tag.id ? (
                        <TextInput
                          value={editingTag.name}
                          onChangeText={(text) => setEditingTag({ ...editingTag, name: text })}
                          onBlur={() => updateTag(editingTag)}
                          onSubmitEditing={() => updateTag(editingTag)}
                          style={[styles.input, { marginBottom: 0 }]}
                          autoFocus
                        />
                      ) : (
                        <Text style={styles.tagName}>{tag.name}</Text>
                      )}
                    </View>

                    {mode === 'manage' && (
                      <View style={styles.tagActions}>
                        <TouchableOpacity
                          onPress={() => setEditingTag(tag)}
                          style={styles.actionButton}
                        >
                          <Edit3 size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => deleteTag(tag.id)}
                          style={styles.actionButton}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}