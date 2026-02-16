import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Text } from 'react-native';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { LoginScreen } from '../../src/components/LoginScreen';
import { Transaction } from '../../src/types';
import { PinModal } from '../../src/components/PinModal';
import { ChangePinModal } from '../../src/components/ChangePinModal';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/hooks/queries/queryKeys';
import { userService } from '@/src/services/userService';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';

export default function OrdersScreen() {
  const { isLoggedIn, fetchUserList, selectedCustomer, pinVerifiedUserId } = useCoffeeStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  // Determine if we should fetch transactions
  const shouldFetchTransactions =
    isLoggedIn &&
    FEATURE_FLAGS.USE_API_CACHING &&
    !!selectedCustomer &&
    (!selectedCustomer.has_pin || pinVerifiedUserId === selectedCustomer.id);

  // Use React Query to fetch transactions with caching
  const { data: reactQueryTransactions, isLoading: isLoadingTransactions } = useQuery<Transaction[], Error>({
    queryKey: queryKeys.users.transactions(selectedCustomer?.id || ''),
    queryFn: () => userService.getStudentTransactions(selectedCustomer!.id),
    enabled: shouldFetchTransactions,
  });

  // Fetch user list when component mounts
  useEffect(() => {
    if (isLoggedIn && !FEATURE_FLAGS.USE_API_CACHING) {
      fetchUserList();
    }
  }, [isLoggedIn, fetchUserList]);

  // Show PIN modal if needed
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.has_pin && pinVerifiedUserId !== selectedCustomer.id) {
      setShowPinModal(true);
    } else {
      setShowPinModal(false);
    }
  }, [selectedCustomer, pinVerifiedUserId]);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Determine which transactions to display
  const transactions: Transaction[] = FEATURE_FLAGS.USE_API_CACHING
    ? (reactQueryTransactions || [])
    : [];

  const loading = FEATURE_FLAGS.USE_API_CACHING
    ? isLoadingTransactions
    : false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.subtitle}>
          {transactions.length} order{transactions.length !== 1 ? 's' : ''} total
        </Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            {selectedCustomer
              ? 'Transaction history will appear here'
              : 'Select a student to view their transactions'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={transactions}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                <Text style={styles.transactionAmount}>
                  ${Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={styles.transactionType}>
                  {item.transaction_type.Purchase?.name || 'Purchase'}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={true}
          />
        </View>
      )}
      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
        }}
        onChangePin={() => {
          setShowPinModal(false);
          setShowChangePinModal(true);
        }}
        userName={selectedCustomer?.name || 'User'}
      />
      <ChangePinModal
        visible={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
        onSuccess={() => {
          setShowChangePinModal(false);
          fetchUserList();
        }}
        userId={selectedCustomer?.id || ''}
        userName={selectedCustomer?.name || 'User'}
        hasExistingPin={selectedCustomer?.has_pin || false}
      />
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
  transactionItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  transactionType: {
    fontSize: 14,
    color: '#666',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
});
