import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserListItem } from '../types';

interface UserCardProps {
  user: UserListItem;
  onPress: () => void;
  isCurrentUser?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onPress, 
  isCurrentUser = false 
}) => {
  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isCurrentUser && styles.currentUserCard,
        !user.isActive && styles.inactiveCard
      ]} 
      onPress={onPress}
    >
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
          {user.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>A</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.nameSection}>
          <Text style={[styles.name, !user.isActive && styles.inactiveText]}>
            {user.name}
            {isCurrentUser && <Text style={styles.currentUserLabel}> (You)</Text>}
          </Text>
          <Text style={[styles.email, !user.isActive && styles.inactiveText]}>
            {user.email}
          </Text>
        </View>

        <View style={styles.statusSection}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={[
              styles.balance,
              user.balance < 5 && styles.lowBalance,
              !user.isActive && styles.inactiveText
            ]}>
              ${user.balance.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              user.isActive ? styles.activeDot : styles.inactiveDot
            ]} />
            <Text style={[styles.lastSeen, !user.isActive && styles.inactiveText]}>
              {formatLastSeen(user.lastSeen)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#8B4513',
    backgroundColor: '#fef8f4',
  },
  inactiveCard: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  leftSection: {
    marginRight: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B4513',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 50,
  },
  adminBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  nameSection: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  currentUserLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceContainer: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  balance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  lowBalance: {
    color: '#ef4444',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#22c55e',
  },
  inactiveDot: {
    backgroundColor: '#ef4444',
  },
  lastSeen: {
    fontSize: 12,
    color: '#666',
  },
  inactiveText: {
    color: '#999',
  },
});