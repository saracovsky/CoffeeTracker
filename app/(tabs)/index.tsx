import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { MenuItemCard } from '../../src/components/MenuItemCard';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { LoginScreen } from '../../src/components/LoginScreen';
import { MenuItem } from '../../src/types';
import { useEffect } from 'react';


// Your existing mockMenuItems (add more variety for better testing)
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Espresso',
    price: 2.50,
    category: 'coffee',
    description: 'Strong and bold coffee shot',
  },
  {
    id: '2',
    name: 'Cappuccino',
    price: 4.00,
    category: 'coffee',
    description: 'Espresso with steamed milk foam',
  },
  {
    id: '3',
    name: 'Latte',
    price: 4.50,
    category: 'coffee',
    description: 'Espresso with steamed milk',
  },
  {
    id: '4',
    name: 'Americano',
    price: 3.00,
    category: 'coffee',
    description: 'Espresso with hot water',
  },
  {
    id: '5',
    name: 'Green Tea',
    price: 2.50,
    category: 'tea',
    description: 'Fresh green tea leaves',
  },
  {
    id: '6',
    name: 'Earl Grey',
    price: 2.75,
    category: 'tea',
    description: 'Classic black tea with bergamot',
  },
  {
    id: '7',
    name: 'Croissant',
    price: 3.50,
    category: 'pastry',
    description: 'Buttery French pastry',
  },
  {
    id: '8',
    name: 'Chocolate Muffin',
    price: 2.75,
    category: 'pastry',
    description: 'Fresh baked chocolate muffin',
  },
];

export default function TabOneScreen() {
  const { 
    setMenuItems, 
    addToCart, 
    isLoggedIn, 
    user, 
    logoutUser,
    filters,
    setSearchQuery,
    setSelectedCategory,
    getFilteredMenuItems,
    selectedCustomer
  } = useCoffeeStore();

  console.log('Main Menu - selectedCustomer:', selectedCustomer?.name);
  console.log('Main Menu - isLoggedIn:', isLoggedIn);

  useEffect(() => {
    setMenuItems(mockMenuItems);
  }, [setMenuItems]);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Admin must select a student before ordering
  if (!selectedCustomer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.name}!</Text>
          <Text style={styles.subtitle}>Please select a student to order coffee for</Text>
        </View>
        
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>
            You need to select a student from the Students tab before you can order coffee.
          </Text>
          <TouchableOpacity style={styles.studentButton} onPress={() => {}}>
            <Text style={styles.studentButtonText}>Go to Students</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSignOut = () => {
    logoutUser();
  };

  const filteredItems = getFilteredMenuItems();

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <MenuItemCard 
      item={item} 
      onAddToCart={addToCart}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Simple Top Bar */}
        <View style={styles.headerTop}>
          <Text style={styles.userName}>Hi, {user?.name}!</Text>
          <View style={styles.headerRight}>
            <Text style={styles.balance}>${selectedCustomer.balance.toFixed(2)}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Title */}
        <Text style={styles.title}>Coffee Menu</Text>
        <Text style={styles.studentInfo}>Ordering for: {selectedCustomer.name}</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search for coffee, tea, pastries..."
      />

      {/* Category Filter */}
      <CategoryFilter
        categories={filters.categories}
        selectedCategory={filters.selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredItems.length} items
          {filters.searchQuery ? ` for "${filters.searchQuery}"` : ''}
          {filters.selectedCategory ? ` in ${filters.selectedCategory}` : ''}
        </Text>
      </View>

      {/* Menu Items List */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
          </View>
        )}
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
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signOutButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8B4513',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  studentInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  studentButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: 'center',
  },
  studentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});