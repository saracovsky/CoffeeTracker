import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useCoffeeStore } from '../../src/stores/coffeeStore';
import { CartItem } from '../../src/types';
import { LoginScreen } from '../../src/components/LoginScreen';

export default function CartScreen() {
  const { cart, removeFromCart, clearCart, selectedCustomer, placeOrder, user, isLoggedIn } = useCoffeeStore();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  console.log('Cart Screen - selectedCustomer:', selectedCustomer?.name);
  console.log('Cart Screen - isLoggedIn:', isLoggedIn);

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Admin must select a student before ordering
  if (!selectedCustomer) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please Select a Student</Text>
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>
            You need to select a student from the Students tab before you can order coffee.
          </Text>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    if (total > selectedCustomer.balance) {
      alert(`Insufficient balance! ${selectedCustomer.name} needs $${(total - selectedCustomer.balance).toFixed(2)} more. Current balance: $${selectedCustomer.balance.toFixed(2)}`);
      return;
    }

    const success = await placeOrder();
    
    if (success) {
      const newBalance = selectedCustomer.balance - total;
      alert(`Order placed successfully! 🎉\nTotal: $${total.toFixed(2)}\n${selectedCustomer.name}'s new balance: $${newBalance.toFixed(2)}`);
    } else {
      alert('Order failed. Please try again.');
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          ${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      
      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add some coffee from the menu!</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
          
          <View style={styles.footer}>
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
            {selectedCustomer && (
              <Text style={styles.balanceInfo}>
                {selectedCustomer.name}'s balance: ${selectedCustomer.balance.toFixed(2)}
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={handlePlaceOrder}
            >
              <Text style={styles.orderButtonText}>Place Order</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearCart}
            >
              <Text style={styles.clearText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 20, 
    color: '#8B4513' 
  },
  list: { 
    flex: 1 
  },
  cartItem: { 
    backgroundColor: 'white', 
    padding: 16, 
    marginHorizontal: 16, 
    marginVertical: 4, 
    borderRadius: 8, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: { 
    flex: 1 
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  itemDetails: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4 
  },
  removeButton: { 
    backgroundColor: '#ff4444', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 4 
  },
  removeButtonText: { 
    color: 'white', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  emptyCart: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#666', 
    fontWeight: 'bold' 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#999', 
    marginTop: 8 
  },
  footer: { 
    padding: 20, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },
  total: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#8B4513', 
    marginBottom: 8 
  },
  balanceInfo: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  orderButton: { 
    backgroundColor: '#8B4513', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  orderButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  clearButton: { 
    backgroundColor: '#666', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  clearText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
});