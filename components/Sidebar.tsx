import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Modal,
  Animated 
} from 'react-native';
import { 
  Menu, 
  X, 
  Home, 
  Tag, 
  Settings, 
  Calendar,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react-native';
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

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (filter: FilterType) => void;
  currentFilter: FilterType;
}

export type FilterType = 
  | 'all' 
  | 'pending' 
  | 'completed' 
  | 'today' 
  | 'overdue'
  | { type: 'tag'; tagId: string; tagName: string };

export default function Sidebar({ visible, onClose, onNavigate, currentFilter }: SidebarProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [user, setUser] = useState<any>(null);
  const { colors } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

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
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, user]);

  const loadTags = async () => {
    if (!user) return;
    
    try {
      const userTags = await blink.db.tags.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });
      setTags(userTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleNavigate = (filter: FilterType) => {
    onNavigate(filter);
    onClose();
  };

  const isActiveFilter = (filter: FilterType) => {
    if (typeof currentFilter === 'string' && typeof filter === 'string') {
      return currentFilter === filter;
    }
    if (typeof currentFilter === 'object' && typeof filter === 'object') {
      return currentFilter.type === filter.type && currentFilter.tagId === filter.tagId;
    }
    return false;
  };

  const menuItems = [
    { 
      id: 'all', 
      label: 'All Tasks', 
      icon: Home, 
      filter: 'all' as FilterType 
    },
    { 
      id: 'pending', 
      label: 'Pending', 
      icon: Clock, 
      filter: 'pending' as FilterType 
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      icon: CheckCircle, 
      filter: 'completed' as FilterType 
    },
    { 
      id: 'today', 
      label: 'Due Today', 
      icon: Calendar, 
      filter: 'today' as FilterType 
    },
    { 
      id: 'overdue', 
      label: 'Overdue', 
      icon: Filter, 
      filter: 'overdue' as FilterType 
    },
  ];

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlay: {
      flex: 1,
    },
    sidebar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 280,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: 'white',
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
      flex: 1,
    },
    section: {
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      paddingHorizontal: 20,
      paddingBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginHorizontal: 12,
      borderRadius: 8,
    },
    activeMenuItem: {
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    menuIcon: {
      marginRight: 12,
    },
    menuText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    activeMenuText: {
      color: colors.primary,
      fontWeight: '600',
    },
    tagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginHorizontal: 12,
      borderRadius: 8,
    },
    activeTagItem: {
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    tagColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    tagText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    activeTagText: {
      color: colors.primary,
      fontWeight: '600',
    },
    emptyTags: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    emptyTagsText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontStyle: 'italic',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Voice Todo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Main Navigation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Navigation</Text>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActiveFilter(item.filter);
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleNavigate(item.filter)}
                    style={[
                      styles.menuItem,
                      isActive && styles.activeMenuItem,
                    ]}
                  >
                    <IconComponent 
                      size={20} 
                      color={isActive ? colors.primary : colors.textSecondary}
                      style={styles.menuIcon}
                    />
                    <Text style={[
                      styles.menuText,
                      isActive && styles.activeMenuText,
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* Tags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              {tags.length === 0 ? (
                <View style={styles.emptyTags}>
                  <Text style={styles.emptyTagsText}>
                    No tags yet. Create tags to organize your tasks.
                  </Text>
                </View>
              ) : (
                tags.map((tag) => {
                  const tagFilter: FilterType = { 
                    type: 'tag', 
                    tagId: tag.id, 
                    tagName: tag.name 
                  };
                  const isActive = isActiveFilter(tagFilter);
                  
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => handleNavigate(tagFilter)}
                      style={[
                        styles.tagItem,
                        isActive && styles.activeTagItem,
                      ]}
                    >
                      <View 
                        style={[
                          styles.tagColor, 
                          { backgroundColor: tag.color }
                        ]} 
                      />
                      <Text style={[
                        styles.tagText,
                        isActive && styles.activeTagText,
                      ]}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}