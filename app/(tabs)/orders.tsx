import React, { useEffect } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { LoginScreen } from '../../src/components/LoginScreen';
import { OrderCard } from '../../src/components/OrderCard';
import { Order } from '../../src/types';

export default function OrdersScreen() {
  const { orders, isLoggedIn, user, userList, fetchUserList } = useCoffeeStore();

  // Fetch user list when component mounts
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserList();
    }
  }, [isLoggedIn, fetchUserList]);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const renderOrder = ({ item }: { item: Order }) => {
    // Find the user who placed this order
    const orderUser = userList.find(user => user.id === item.userId);
    
    return <OrderCard order={item} user={orderUser} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.subtitle}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} total
        </Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>
            Your order history will appear here after you place your first order
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8B4513',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});