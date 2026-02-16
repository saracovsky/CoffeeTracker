import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { LoginScreen } from '../../src/components/LoginScreen';
import { UserCard } from '../../src/components/UserCard';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { ChangePinModal } from '../../src/components/ChangePinModal';
import { UserListItem } from '../../src/types';
import type { MenuItem } from '../../src/types';
import { PinModal } from '../../src/components/PinModal';
import { PinErrorBoundary } from '../../src/components/PinErrorBoundary';
import * as Sentry from '@sentry/react-native';
import { User } from '@/src/types';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/hooks/queries/queryKeys';
import { userService } from '@/src/services/userService';
import { useBuyDrink } from '@/src/hooks/queries/useUserQueries';
import { Drink } from '@/src/types';
import { drinkService } from '@/src/services/drinkService';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { useConditionalMemo } from '@/src/utils/conditionalMemo';
import { useDebounce } from '@/src/hooks/useDebounce';
import { trackInteraction } from '@/src/utils/sentryInteraction';

export default function StudentsScreen() {
  const {
    fetchUserList,
    fetchMenuItems,
    userList,
    menuItems,
    isLoggedIn,
    setSelectedCustomer,
    selectedCustomer,
    pinVerifiedUserId,
    verifiedPin,
    filters,
    setSearchQuery: setMenuSearchQuery,
    setSelectedCategory: setMenuSelectedCategory,
  } = useCoffeeStore();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [menuSearchInput, setMenuSearchInput] = useState('');
  const debouncedMenuSearch = useDebounce(menuSearchInput, 300);

  useEffect(() => {
    setMenuSearchQuery(debouncedMenuSearch);
  }, [debouncedMenuSearch, setMenuSearchQuery]);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  const buyDrinkMutation = useBuyDrink();

  const { data: reactQueryDrinks } = useQuery<Drink[], Error>({
    queryKey: queryKeys.drinks.all,
    queryFn: () => drinkService.getDrinks(),
    enabled: isLoggedIn && FEATURE_FLAGS.USE_API_CACHING,
  });

  const { data: reactQueryUsers } = useQuery<User[], Error>({
    queryKey: queryKeys.users.all,
    queryFn: () => userService.getAllUsers(),
    enabled: isLoggedIn && FEATURE_FLAGS.USE_API_CACHING,
  });

  useEffect(() => {
    if (isLoggedIn && !FEATURE_FLAGS.USE_API_CACHING) {
      fetchUserList();
      fetchMenuItems();
    }
  }, [isLoggedIn, fetchUserList, fetchMenuItems]);

  const filteredUsers = useConditionalMemo(() => {
    let userListItems: UserListItem[];

    if (FEATURE_FLAGS.USE_API_CACHING) {
      const users = reactQueryUsers || [];
      userListItems = users.map(user => {
        const backendUser = user as any;
        return {
          id: user.id,
          name: backendUser.first_name && backendUser.last_name
            ? `${backendUser.first_name} ${backendUser.last_name}`
            : user.name || 'Unknown',
          email: user.email,
          balance: user.balance || 0,
          isActive: true,
          role: user.role === 'admin' ? 'admin' : 'user',
          has_pin: user.has_pin || false,
          lastSeen: user.createdAt,
        };
      });
    } else {
      userListItems = userList || [];
    }

    return userListItems.filter(student => {
      const name = student?.name || '';
      const email = student?.email || '';
      const query = debouncedSearchQuery || '';

      const matchesSearch = name.toLowerCase().includes(query.toLowerCase()) ||
                         email.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = !filterActive || student.isActive;

      return matchesSearch && matchesFilter;
    });
  }, [reactQueryUsers, userList, debouncedSearchQuery, filterActive]);

  const selectedUserFromCache = useConditionalMemo(() => {
    if (!selectedCustomer) return null;

    if (FEATURE_FLAGS.USE_API_CACHING) {
      const user = reactQueryUsers?.find(u => u.id === selectedCustomer.id);
      if (!user) return null;

      const backendUser = user as any;
      return {
        id: user.id,
        name: backendUser.first_name && backendUser.last_name
          ? `${backendUser.first_name} ${backendUser.last_name}`
          : user.name || 'Unknown',
        email: user.email,
        balance: user.balance || 0,
        isActive: true,
        role: user.role === 'admin' ? 'admin' : 'user',
        has_pin: user.has_pin || false,
        lastSeen: user.createdAt,
      };
    } else {
      return userList?.find(u => u.id === selectedCustomer.id) || null;
    }
  }, [reactQueryUsers, userList, selectedCustomer]);

  const filteredDrinks = useConditionalMemo(() => {
    let menuItemsList: MenuItem[];

    if (FEATURE_FLAGS.USE_API_CACHING) {
      const drinks = reactQueryDrinks || [];
      menuItemsList = drinks.map(drink => ({
        id: drink.id,
        name: drink.name,
        price: drink.price,
        category: drink.category || undefined,
        description: drink.description || undefined,
        imageUrl: drink.icon || undefined,
      }));
    } else {
      menuItemsList = menuItems || [];
    }

    return menuItemsList.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                           (item.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) || false);

      const matchesCategory = !filters.selectedCategory ||
                             (item.category?.toLowerCase() === filters.selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [reactQueryDrinks, menuItems, filters.searchQuery, filters.selectedCategory]);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const handleUserPress = async (student: UserListItem) => {
    await trackInteraction(`select-student-${student.id}`, () => {
      const { clearPinVerification, pinVerifiedUserId } = useCoffeeStore.getState();
      if (pinVerifiedUserId !== student.id) {
        clearPinVerification();
      }

      Sentry.addBreadcrumb({
        category: 'user_interaction',
        message: `Admin selected student: ${student.name}`,
        level: 'info',
        data: {
          studentId: student.id,
          studentEmail: student.email,
          studentBalance: student.balance,
          hasPin: student.has_pin,
          isActive: student.isActive,
          timestamp: new Date().toISOString(),
        },
      });
      setSelectedCustomer(student);
    });
  };

  const handlePlaceOrder = async (item: MenuItem) => {

    Sentry.addBreadcrumb({
      category: 'order',
      message: `Order attempt started for ${item.name}`,
      level: 'info',
      data: {
        itemId: item.id,
        itemName: item.name,
        itemPrice: item.price,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        customerBalance: selectedCustomer?.balance,
      },
    });
    
    const currentState = useCoffeeStore.getState();
    const currentCustomer = currentState.selectedCustomer;
    
    if (!currentCustomer) {
      Sentry.addBreadcrumb({
        category: 'order',
        message: 'Order failed: No customer selected',
        level: 'error',
      });
      console.error('No customer selected');
      return;
    }
    
    const currentBalance = selectedUserFromCache?.balance ?? currentCustomer.balance ?? 0;
    if (currentBalance < item.price) {
      const message = `${currentCustomer.name} does not have enough balance to purchase ${item.name}. Current balance: $${currentBalance.toFixed(2)}, Item price: $${item.price.toFixed(2)}`;
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Insufficient Balance', message);
      }
      return;
    }

    if (currentCustomer.has_pin && currentState.pinVerifiedUserId !== currentCustomer.id) {
      Sentry.addBreadcrumb({
        category: 'order',
        message: 'PIN verification required',
        level: 'info',
        data: {
          customerId: currentCustomer.id,
          hasPinSet: currentCustomer.has_pin,
          isPinVerified: currentState.pinVerifiedUserId === currentCustomer.id,
        },
      });

      setPendingAction(() => () => {
        const state = useCoffeeStore.getState();
        buyDrinkMutation.mutate(
          {
            userId: currentCustomer.id,
            drinkId: item.id,
            userPin: state.verifiedPin || undefined,
          },
          {
            onSuccess: () => {
              if (!FEATURE_FLAGS.USE_API_CACHING) {
                fetchUserList();
              }
            },
          }
        );
      });

      setShowPinModal(true);
      return;
    }
    
    // BREADCRUMB 4: Calling buyDrink mutation
    Sentry.addBreadcrumb({
      category: 'order',
      message: 'Processing purchase',
      level: 'info',
    });
    try {
      const updatedUser = await buyDrinkMutation.mutateAsync({
        userId: currentCustomer.id,
        drinkId: item.id,
        userPin: verifiedPin || undefined,
      });

      Sentry.addBreadcrumb({
        category: 'order',
        message: 'Order completed successfully',
        level: 'info',
        data: {
          success: true,
          itemName: item.name,
          updatedBalance: updatedUser.balance,
        },
      });

      if (!FEATURE_FLAGS.USE_API_CACHING) {
        fetchUserList();
      }
    } catch (error: any) {
      Sentry.addBreadcrumb({
        category: 'order',
        message: 'Order failed',
        level: 'error',
        data: {
          success: false,
          itemName: item.name,
          error: error.message,
        },
      });
    }

  };

  

  const renderUser = ({ item }: { item: UserListItem }) => (
    <UserCard 
      user={item} 
      onPress={() => handleUserPress(item)}
      isCurrentUser={false}
    />
  );

  return (
    <View style={styles.container}>
      <TestErrorBoundary />

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.filterButton, filterActive && styles.activeFilter]}
          onPress={() => setFilterActive(!filterActive)}
          testID="student-filter-toggle"
        >
          <Text style={[styles.filterText, filterActive && styles.activeFilterText]}>
            {filterActive ? 'Show All' : 'Active Only'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.splitPane}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students..."
            />
          </View>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedCustomer?.id === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => handleUserPress(item)}
                    style={[styles.sidebarItem, isSelected && styles.sidebarItemSelected]}
                    testID={`student-list-item-${item.id}`}
                    accessibilityLabel={`student-list-item-${item.id}`}
                  >
                    <Text style={[styles.sidebarItemName, !item.isActive && styles.inactiveText]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.sidebarItemEmail, !item.isActive && styles.inactiveText]}>
                      {item.email}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.detailsPane}>
          {!selectedCustomer ? (
            <View style={styles.detailsEmpty}>
              <Text style={styles.detailsTitle}>Select a student</Text>
              <Text style={styles.detailsSubtitle}>Tap a student on the left to view details</Text>
            </View>
          ) : (
            <View style={styles.detailsContent}>
             <View style={styles.detailsHeaderTop}>
              <View style={styles.headerRightRow}>
                {(!selectedCustomer.has_pin || pinVerifiedUserId === selectedCustomer.id) && (
                  <Text style={styles.detailsBalance}>
                    ${(selectedUserFromCache?.balance || selectedCustomer.balance || 0).toFixed(2)}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.cartToggleInline}
                  onPress={() => setShowProfile(!showProfile)}
                  testID="toggle-profile-menu"
                >
                  <Text style={styles.cartToggleText}>
                    {showProfile ? '📋 Menu' : '👤 Profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

              {showProfile ? (
                <UserCard
                    user={selectedCustomer}
                    onPress={() => {}}
                    isCurrentUser={false}
                    onManagePin={() => setShowChangePinModal(true)}
                  />
              ) : selectedCustomer.has_pin && pinVerifiedUserId !== selectedCustomer.id ? (
                <View style={styles.pinRequiredContainer}>
                  <Text style={styles.pinRequiredIcon}>🔒</Text>
                  <Text style={styles.pinRequiredTitle}>PIN Required</Text>
                  <Text style={styles.pinRequiredText}>
                    {selectedCustomer.name} has PIN protection enabled.
                  </Text>
                  <Text style={styles.pinRequiredText}>
                    Please verify PIN to access the menu.
                  </Text>
                  <TouchableOpacity
                    style={styles.verifyPinButton}
                    onPress={() => setShowPinModal(true)}
                    testID="verify-pin-button"
                  >
                    <Text style={styles.verifyPinButtonText}>Enter PIN</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <SearchBar
                    value={menuSearchInput}
                    onChangeText={setMenuSearchInput}
                    placeholder="Search for coffee, tea, pastries..."
                  />
                  <CategoryFilter
                    categories={filters.categories}
                    selectedCategory={filters.selectedCategory}
                    onSelectCategory={setMenuSelectedCategory}
                  />
                  <View style={styles.resultsInfo}>
                    <Text style={styles.resultsText}>
                      {filteredDrinks.length} items
                      {filters.searchQuery ? ` for "${filters.searchQuery}"` : ''}
                      {filters.selectedCategory ? ` in ${filters.selectedCategory}` : ''}
                    </Text>
                  </View>
                  <FlatList
                    data={filteredDrinks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }: { item: MenuItem }) => (
                      <MenuItemCard item={item} onPlaceOrder={handlePlaceOrder} />
                    )}
                    numColumns={4}
                    columnWrapperStyle={styles.row}
                    style={styles.menuList}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No items found</Text>
                        <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
                      </View>
                    )}
                  />
                </>
              )}
            </View>
          )}
        </View>
      </View>

      <PinErrorBoundary
        onReset={() => {
          setShowPinModal(false);
          setShowChangePinModal(false);
          setPendingAction(null);
        }}
      >
        <PinModal
          visible={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setPendingAction(null);
          }}
          onSuccess={() => {
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
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
      </PinErrorBoundary>
      

    </View>
  );
}

// Test component for measuring error boundary impact on crash-free session rate
function TestErrorBoundary() {
  const [shouldError, setShouldError] = useState(false);
  const [errorType, setErrorType] = useState<'null-ref' | 'undefined-prop' | 'type-error'>('null-ref');

  if (shouldError) {
    switch (errorType) {
      case 'null-ref':
        const nullUser: any = null;
        return <Text>{nullUser.name}</Text>;

      case 'undefined-prop':
        const undefinedData: any = undefined;
        return <Text>{undefinedData.items.length}</Text>;

      case 'type-error':
        const notAnArray: any = 'not an array';
        return (
          <View>
            {notAnArray.map((item: any) => <Text key={item}>{item}</Text>)}
          </View>
        );
    }
  }

  return (
    <View style={{ margin: 10, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#333' }}>
        Runtime Error Test (Thesis)
      </Text>

      {/* Error Type Selection */}
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
        <TouchableOpacity
          style={{
            padding: 8,
            backgroundColor: errorType === 'null-ref' ? '#2196F3' : '#e0e0e0',
            borderRadius: 4,
          }}
          onPress={() => setErrorType('null-ref')}
        >
          <Text style={{ fontSize: 10, color: errorType === 'null-ref' ? 'white' : '#666' }}>
            Null Ref
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: 8,
            backgroundColor: errorType === 'undefined-prop' ? '#2196F3' : '#e0e0e0',
            borderRadius: 4,
          }}
          onPress={() => setErrorType('undefined-prop')}
        >
          <Text style={{ fontSize: 10, color: errorType === 'undefined-prop' ? 'white' : '#666' }}>
            Undefined Prop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            padding: 8,
            backgroundColor: errorType === 'type-error' ? '#2196F3' : '#e0e0e0',
            borderRadius: 4,
          }}
          onPress={() => setErrorType('type-error')}
        >
          <Text style={{ fontSize: 10, color: errorType === 'type-error' ? 'white' : '#666' }}>
            Type Error
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trigger Button */}
      <TouchableOpacity
        style={{
          padding: 16,
          backgroundColor: FEATURE_FLAGS.USE_ERROR_BOUNDARIES ? '#4CAF50' : '#ff9800',
          borderRadius: 8,
          minWidth: 220,
        }}
        onPress={() => setShouldError(true)}
        testID="test-runtime-error"
      >
        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 12 }}>
          {FEATURE_FLAGS.USE_ERROR_BOUNDARIES
            ? 'Trigger Runtime Error'
            : 'Trigger Runtime Error (WILL CRASH)'}
        </Text>
        <Text style={{ color: 'white', fontSize: 9, textAlign: 'center', marginTop: 4 }}>
          {FEATURE_FLAGS.USE_ERROR_BOUNDARIES
            ? 'Will be caught → Errored Session'
            : 'Will crash → Crashed Session'}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', fontStyle: 'italic', marginTop: 8, maxWidth: 300 }}>
        Error Boundaries: {FEATURE_FLAGS.USE_ERROR_BOUNDARIES ? 'ON' : 'OFF'}
      </Text>
      <Text style={{ fontSize: 9, color: '#999', textAlign: 'center', marginTop: 4, maxWidth: 300 }}>
        {FEATURE_FLAGS.USE_ERROR_BOUNDARIES
          ? 'Impact: Does NOT affect crash-free session rate (caught error)'
          : 'Impact: DOES affect crash-free session rate (unhandled crash)'}
      </Text>
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
  controlsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
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
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilter: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  splitPane: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },

  sidebarHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    backgroundColor: '#fafafa',
  },
  sidebarItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  sidebarItemSelected: {
    backgroundColor: '#fef8f4',
  },
  sidebarItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sidebarItemEmail: {
    fontSize: 12,
    color: '#666',
  },
  inactiveText: {
    color: '#999',
  },
  detailsPane: {
    flex: 1,
    padding: 16,
  },
  detailsEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4513',
  },
  detailsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  detailsContent: {
    flex: 1,
    gap: 8,
  },
  detailsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  detailsName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  detailsEmail: {
    fontSize: 14,
    color: '#666',
  },
  detailsBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginTop: 6,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartToggleInline: {
    backgroundColor: '#8B4513',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  cartToggleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsInfo: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  menuList: {
    flex: 1,
  },
  row: {
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
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
  pinRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#fef8f4',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  pinRequiredIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  pinRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 12,
    textAlign: 'center',
  },
  pinRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  verifyPinButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyPinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});