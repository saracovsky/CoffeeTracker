import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { LoginScreen } from '../../src/components/LoginScreen';
import { UserCard } from '../../src/components/UserCard';
import { SearchBar } from '../../src/components/SearchBar';
import { UserListItem } from '../../src/types';

export default function StudentsScreen() {
  const { 
    userList, 
    fetchUserList, 
    isLoggedIn, 
    user,
    selectUser,
    setSelectedCustomer,
    selectedCustomer,
  } = useCoffeeStore();
  
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
    console.log('Student pressed:', student.name);
    
    Alert.alert(
      student.name,
      `Balance: $${student.balance.toFixed(2)}\nEmail: ${student.email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Order Coffee For', 
          onPress: () => {
            console.log('Setting selected customer:', student.name);
            setSelectedCustomer(student);
            Alert.alert('Student Selected', `${student.name} is now selected for ordering. You can go to the Menu tab to order coffee for them.`);
          }
        },
        { 
          text: 'Add Money', 
          onPress: () => {
            Alert.alert('Add Money', `Add money to ${student.name}'s account. This feature will be implemented soon!`);
          }
        },
      ]
    );
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
      <View style={styles.header}>
        <Text style={styles.title}>Students & Staff</Text>
        <Text style={styles.subtitle}>
          {filteredUsers.length} {filterActive ? 'active' : 'total'} users
        </Text>
        {selectedCustomer && (
          <View style={styles.selectedStudentInfo}>
            <Text style={styles.selectedStudentText}>
              🎯 Ordering for: {selectedCustomer.name} (${selectedCustomer.balance.toFixed(2)})
            </Text>
            <TouchableOpacity 
              style={styles.clearSelectionButton}
              onPress={() => setSelectedCustomer(null)}
            >
              <Text style={styles.clearSelectionText}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search students..."
      />

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filterActive && styles.activeFilter]}
          onPress={() => setFilterActive(!filterActive)}
        >
          <Text style={[styles.filterText, filterActive && styles.activeFilterText]}>
            {filterActive ? 'Show All' : 'Active Only'}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
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
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
  selectedStudentInfo: {
    backgroundColor: '#e0f2f7', // Light blue background
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  selectedStudentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff', // Blue text
    textAlign: 'center',
  },
  clearSelectionButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#dc3545', // Red background
    borderRadius: 15,
    alignSelf: 'center',
  },
  clearSelectionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});