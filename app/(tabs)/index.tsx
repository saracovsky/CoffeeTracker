import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { LoginScreen } from '../../src/components/LoginScreen';
import { UserCard } from '../../src/components/UserCard';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { CartDisplay } from '../../src/components/CartDisplay';
import { UserListItem } from '../../src/types';
import type { MenuItem } from '../../src/types';

export default function StudentsScreen() {
  const { 
    userList, 
    fetchUserList, 
    isLoggedIn, 
    user,
    selectUser,
    setSelectedCustomer,
    selectedCustomer,
    // Menu/cart/filters from store for embedded menu
    filters,
    setSearchQuery: setMenuSearchQuery,
    setSelectedCategory: setMenuSelectedCategory,
    getFilteredMenuItems,
    cart,
    addToCart,
    placeOrder,
  } = useCoffeeStore();
  const router = useRouter();
  const [showCart, setShowCart] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(true);

  console.log('Student Screen - selectedCustomer:', selectedCustomer?.name);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserList().catch(error => {
        console.error('Failed to fetch user list:', error);
        // You could add a toast notification here
      });
    }
  }, [isLoggedIn]); // Removed fetchUserList dependency since it's stable

  // Memoize filtered users to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => {
    return userList.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !filterActive || student.isActive;
      
      return matchesSearch && matchesFilter;
    });
  }, [userList, searchQuery, filterActive]);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const handleUserPress = (student: UserListItem) => {
    setSelectedCustomer(student);
  };

  const handlePlaceOrder = async () => {
    const success = await placeOrder();
    if (success) {
      setShowCart(false);
    }
  };

  const renderUser = ({ item }: { item: UserListItem }) => (
    <UserCard 
      user={item} 
      onPress={() => handleUserPress(item)}
      isCurrentUser={false} // Admins are never "current users" in student context
    />
  );

  return (
    <View style={styles.container}>
      {/* Header removed to save vertical space */}

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.filterButton, filterActive && styles.activeFilter]}
          onPress={() => setFilterActive(!filterActive)}
        >
          <Text style={[styles.filterText, filterActive && styles.activeFilterText]}>
            {filterActive ? 'Show All' : 'Active Only'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.splitPane}>
        <View style={styles.sidebar}>
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
              {/* Compact header with student search (left) and balance/cart/toggle (right) */}
              <View style={styles.detailsHeaderTop}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search students..."
                  />
                </View>
                <View style={styles.headerRightRow}>
                  <Text style={styles.detailsBalance}>${selectedCustomer.balance.toFixed(2)}</Text>
                  <View style={styles.cartIndicator}>
                    <Text style={styles.cartIndicatorText}>{cart.length}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.cartToggleInline}
                    onPress={() => setShowCart(!showCart)}
                  >
                    <Text style={styles.cartToggleText}>
                      {showCart ? '📋 Menu' : `🛒 Cart (${cart.length})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cart Toggle moved inline in header */}

              {showCart ? (
                <CartDisplay onPlaceOrder={handlePlaceOrder} />
              ) : (
                <>
                  {/* Embedded Menu Controls */}
                  <SearchBar
                    value={filters.searchQuery}
                    onChangeText={setMenuSearchQuery}
                    placeholder="Search for coffee, tea, pastries..."
                  />
                  <CategoryFilter
                    categories={filters.categories}
                    selectedCategory={filters.selectedCategory}
                    onSelectCategory={setMenuSelectedCategory}
                  />
                  <View style={styles.resultsInfo}>
                    <Text style={styles.resultsText}>
                      {getFilteredMenuItems().length} items
                      {filters.searchQuery ? ` for "${filters.searchQuery}"` : ''}
                      {filters.selectedCategory ? ` in ${filters.selectedCategory}` : ''}
                    </Text>
                  </View>
                  {/* Embedded Menu Grid */}
                  <FlatList
                    data={getFilteredMenuItems()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }: { item: MenuItem }) => (
                      <MenuItemCard item={item} onAddToCart={addToCart} />
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
    justifyContent: 'space-between',
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
  cartIndicator: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  cartIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartToggleButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
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
  
});