import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuItem } from '../types';
import { trackInteraction } from '../utils/sentryInteraction';

interface MenuItemCardProps {
  item: MenuItem;
  onPlaceOrder: (item: MenuItem) => Promise<void>;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onPlaceOrder }) => {
  const handlePress = async () => {
    await trackInteraction(`buy-drink-${item.id}`, async () => {
      await onPlaceOrder(item);
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handlePress}
          testID={`buy-drink-${item.id}`}
          accessibilityLabel={`buy-drink-${item.id}`}
        >
        <Text style={styles.addButtonText}>Buy Now</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 12,
    margin: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexBasis: '25%',
    maxWidth: '25%',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    flex: 1,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  addButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    width: '100%',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});