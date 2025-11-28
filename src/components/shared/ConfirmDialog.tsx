import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Dialog, Text, Button, Portal } from 'react-native-paper'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmColor?: string
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  confirmColor = '#dc2626',
}: ConfirmDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            onPress={onConfirm}
            mode="contained"
            loading={loading}
            disabled={loading}
            buttonColor={confirmColor}
            textColor="#fff"
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
})


