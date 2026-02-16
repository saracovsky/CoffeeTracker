import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { useCoffeeStore } from '../stores/coffeeStore';
import { trackInteraction } from '../utils/sentryInteraction';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onChangePin: () => void;
  userName: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onChangePin,
  userName,
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verifySelectedUserPin } = useCoffeeStore();
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    //Track PIN verification interaction with Sentry
    await trackInteraction('verify-pin', async () => {
      if (!pin.trim()) {
        setError('Please enter a PIN');
        return;
      }

      setError('');
      setIsLoading(true);
      try {
        const success = await verifySelectedUserPin(pin);
        if (success) {
          setPin('');
          onSuccess();
          onClose();
        } else {
          setError('Invalid PIN. Please try again.');
          setPin('');
        }
      } catch (error) {
        setError('Failed to verify PIN. Please try again.');
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Enter PIN for {userName}</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter PIN"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={onClose} testID="pin-modal-cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="pin-modal-verify"
            >
              <Text style={styles.submitText}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.changePinButton} onPress={onChangePin} testID="pin-modal-change-pin">
            <Text style={styles.changePinText}>Change PIN</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  submitText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  changePinButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginTop: 8,
  },
  changePinText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
});