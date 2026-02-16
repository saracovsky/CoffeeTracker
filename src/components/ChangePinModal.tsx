import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { useCoffeeStore } from '../stores/coffeeStore';
import { trackInteraction } from '../utils/sentryInteraction';

interface ChangePinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
  hasExistingPin?: boolean;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
  userName,
  hasExistingPin = true,
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateUserPin } = useCoffeeStore();

  const handleSubmit = async () => {
    await trackInteraction(`change-pin-${userId}`, async () => {
      setError('');

      if (hasExistingPin && !oldPin.trim()) {
        setError('Current PIN is required');
        return;
      }

      if (!newPin.trim() || !confirmPin.trim()) {
        setError('New PIN and confirmation are required');
        return;
      }

      if (newPin !== confirmPin) {
        setError('New PINs do not match');
        return;
      }

      if (newPin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }

      setIsLoading(true);
      try {
        // If setting PIN for the first time, use empty string as old PIN
        const oldPinValue = hasExistingPin ? oldPin : '';
        console.log('[ChangePinModal] Updating PIN:', {
          userId,
          hasExistingPin,
          oldPinValue: oldPinValue ? '***' : '(empty)',
          newPinLength: newPin.length,
        });

        const success = await updateUserPin(userId, oldPinValue, newPin);

        console.log('[ChangePinModal] Update result:', success);

        if (success) {
          setOldPin('');
          setNewPin('');
          setConfirmPin('');
          onSuccess();
          onClose();
          Alert.alert('Success', hasExistingPin ? 'PIN updated successfully' : 'PIN set successfully');
        } else {
          console.error('[ChangePinModal] Update failed: success=false');
          setError(hasExistingPin ? 'Failed to update PIN. Check your old PIN.' : 'Failed to set PIN. Please try again.');
        }
      } catch (error: any) {
        console.error('[ChangePinModal] Update error:', error);
        console.error('[ChangePinModal] Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
        setError(hasExistingPin ? 'Failed to update PIN. Please try again.' : 'Failed to set PIN. Please try again.');
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {hasExistingPin ? `Change PIN for ${userName}` : `Set PIN for ${userName}`}
          </Text>

          {hasExistingPin && (
            <TextInput
              style={styles.input}
              value={oldPin}
              onChangeText={setOldPin}
              placeholder="Current PIN"
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
            />
          )}
          
          <TextInput
            style={styles.input}
            value={newPin}
            onChangeText={setNewPin}
            placeholder="New PIN"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
          />
          
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm New PIN"
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={onClose} testID="change-pin-modal-cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="change-pin-modal-submit"
            >
              <Text style={styles.submitText}>
                {isLoading ? (hasExistingPin ? 'Updating...' : 'Setting...') : (hasExistingPin ? 'Update PIN' : 'Set PIN')}
              </Text>
            </Pressable>
          </View>
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
    width: '85%',
    maxWidth: 350,
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
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
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
});

export default ChangePinModal;