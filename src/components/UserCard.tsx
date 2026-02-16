import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UserListItem } from '../types';
import { useCoffeeStore } from '../stores/coffeeStore';
import { useConditionalMemo, conditionalMemo } from '../utils/conditionalMemo';

interface UserCardProps {
  user: UserListItem;
  onPress: () => void;
  isCurrentUser?: boolean;
  onManagePin?: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
};

const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isCoffeePurchase = (name?: string) => {
  if (!name) return false;
  const n = name.toLowerCase();
  return n.includes('coffee') || n.includes('kaffee') || n.includes('espresso') || n.includes('latte') || n.includes('cappuccino');
};

const computeStreakDays = (purchaseDates: string[]) => {
  if (purchaseDates.length === 0) return 0;
  const unique = Array.from(new Set(purchaseDates)).sort().reverse();
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 0; i < unique.length; i++) {
    const d = new Date(unique[i]);
    const dayOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dayOnly.getTime() === cursor.getTime()) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (streak === 0) return 0;
      break;
    }
  }
  return streak;
};

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onPress,
  isCurrentUser = false,
  onManagePin,
}) => {
  const initials = useConditionalMemo(() => getInitials(user?.name), [user?.name]);

  const { fetchTransactionHistory } = useCoffeeStore();
  const [cupsCount, setCupsCount] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);

  const co2Kg = useConditionalMemo(() => {
    const cups = cupsCount ?? 0;
    return cups * 0.4; // ~0.4 kg CO2 per cup
  }, [cupsCount]);

  const plasticSavedGrams = useConditionalMemo(() => {
    const reusableCups = cupsCount ?? 0; // assuming reusable used for each counted cup
    return reusableCups * 12; // 12g per reusable cup
  }, [cupsCount]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const tx = await fetchTransactionHistory(user.id);
        const coffeePurchases = tx.filter(t => {
          const purchase = (t.transaction_type as any)?.Purchase;
          return !!purchase && isCoffeePurchase(purchase.name);
        });

        const count = coffeePurchases.length;
        const dateKeys = coffeePurchases.map(t => toDateKey(new Date(t.timestamp)));
        const streak = computeStreakDays(dateKeys);

        if (isMounted) {
          setCupsCount(count);
          setStreakDays(streak);
        }
      } catch {
        if (isMounted) {
          setCupsCount(0);
          setStreakDays(0);
        }
      }
    };
    load();
    return () => { isMounted = false; };
  }, [user.id, fetchTransactionHistory]);

  const containerStyles = [
    styles.card,
    isCurrentUser && styles.currentUserCard,
    !user?.isActive && styles.inactiveCard,
  ];

  return (
    <View style={styles.cardContainer}>
      <Pressable
        style={containerStyles}
        onPress={onPress}
        disabled={!user?.isActive}
        testID={`user-card-${user?.id}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !user?.isActive, selected: isCurrentUser }}
        accessibilityLabel={`${user?.name ?? 'Unknown user'}${isCurrentUser ? ' (you)' : ''}, ${user?.isActive ? 'active' : 'inactive'}`}
      >
        <View style={styles.leftSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
            {user?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>A</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.nameSection}>
            <Text style={[styles.name, !user?.isActive && styles.inactiveText]} numberOfLines={1} ellipsizeMode="tail">
              {user?.name ?? '—'}
              {isCurrentUser && <Text style={styles.currentUserLabel}> (You)</Text>}
            </Text>

            <Text style={[styles.email, !user?.isActive && styles.inactiveText]} numberOfLines={1} ellipsizeMode="tail">
              {user?.email ?? '—'}
            </Text>
            <Text style={styles.metaText}>
              {cupsCount === null ? 'Cups: …' : `Cups: ${cupsCount}`}
            </Text>
            <Text style={styles.metaText}>
              {streakDays === null ? 'Streak: …' : `Streak: ${streakDays} day${streakDays === 1 ? '' : 's'}`}
            </Text>
            <Text style={styles.metaText}>
              {cupsCount === null ? 'CO₂: …' : `CO₂: ${co2Kg.toFixed(1)} kg`}
            </Text>
            <Text style={styles.metaText}>
              {cupsCount === null ? 'Plastic saved: …' : `Plastic saved: ${plasticSavedGrams.toFixed(0)} g`}
            </Text>
          </View>

          <View style={styles.statusSection}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, user?.isActive ? styles.activeDot : styles.inactiveDot]} />
            </View>
          </View>
        </View>
      </Pressable>

      {onManagePin && (
        <Pressable
          style={styles.managePinButton}
          onPress={(e) => {
            e.stopPropagation();
            onManagePin();
          }}
          testID={`user-card-manage-pin-${user?.id}`}
        >
          <Text style={styles.managePinText}>
            {user.has_pin ? '🔒 Change PIN' : '🔓 Set PIN'}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default conditionalMemo(UserCard);

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#8B4513',
    backgroundColor: '#fef8f4',
  },
  inactiveCard: {
    opacity: 0.7,
    backgroundColor: '#f9f9f9',
  },
  leftSection: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adminBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
  metaText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  inactiveText: {
    color: '#999',
  },
  managePinButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  managePinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
  },
});
