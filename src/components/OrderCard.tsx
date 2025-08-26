import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Order, UserListItem } from '../types';

interface OrderCardProps {
  order: Order;
  user?: UserListItem | null;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, user }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={toggleExpanded}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          {user && (
            <Text style={styles.orderedBy}>Ordered by: {user.name}</Text>
          )}
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.total}>${order.total.toFixed(2)}</Text>
          <View style={styles.orderTypeBadge}>
            <Text style={styles.orderTypeText}>Order Placed</Text>
          </View>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.details}>
          <Text style={styles.itemsTitle}>Items:</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.expandIndicator}>
        <Text style={styles.expandText}>
          {isExpanded ? 'Tap to collapse' : 'Tap for details'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderedBy: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  orderTypeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  expandIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  expandText: {
    fontSize: 12,
    color: '#8B4513',
    fontStyle: 'italic',
  },
});