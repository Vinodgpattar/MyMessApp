import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Text, TextInput, Button, Card, Snackbar, ActivityIndicator } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { sendAnnouncement, pickImageFromGallery, takePhotoWithCamera, SendAnnouncementData } from '@/lib/announcements'
import { useStudents } from '@/hooks/useStudents'

type TargetType = 'all' | 'active' | 'expiring' | 'expired' | 'custom'

export default function SendAnnouncementScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [targetType, setTargetType] = useState<TargetType>('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set())
  const [showStudentSelector, setShowStudentSelector] = useState(false)
  const [sending, setSending] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  // Fetch students for custom selection
  const { data: studentsData } = useStudents({ active: true, limit: 1000 })
  const allStudents = studentsData?.students || []

  const handlePickImage = async () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: async () => {
          const result = await takePhotoWithCamera()
          if (result.error) {
            setSnackbarMessage(result.error.message)
            setSnackbarVisible(true)
          } else if (result.uri) {
            setImageUri(result.uri)
          }
        }},
        { text: 'Gallery', onPress: async () => {
          const result = await pickImageFromGallery()
          if (result.error) {
            setSnackbarMessage(result.error.message)
            setSnackbarVisible(true)
          } else if (result.uri) {
            setImageUri(result.uri)
          }
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  const handleRemoveImage = () => {
    setImageUri(null)
  }

  const handleStudentToggle = (studentId: number) => {
    const newSet = new Set(selectedStudentIds)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setSelectedStudentIds(newSet)
  }

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setSnackbarMessage('Title is required')
      setSnackbarVisible(true)
      return
    }

    if (!message.trim()) {
      setSnackbarMessage('Message is required')
      setSnackbarVisible(true)
      return
    }

    if (targetType === 'custom' && selectedStudentIds.size === 0) {
      setSnackbarMessage('Please select at least one student')
      setSnackbarVisible(true)
      return
    }

    // Confirmation
    Alert.alert(
      'Send Announcement',
      `Send this announcement to ${targetType === 'custom' ? selectedStudentIds.size : targetType} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true)
            try {
              const data: SendAnnouncementData = {
                title: title.trim(),
                message: message.trim(),
                imageUri,
                targetType,
                studentIds: targetType === 'custom' ? Array.from(selectedStudentIds) : undefined,
              }

              const result = await sendAnnouncement(data)

              if (result.success) {
                setSnackbarMessage(`✅ Announcement sent to ${result.totalSent} students!`)
                setSnackbarVisible(true)
                // Reset form
                setTitle('')
                setMessage('')
                setImageUri(null)
                setTargetType('all')
                setSelectedStudentIds(new Set())
                // Navigate back after a delay
                setTimeout(() => {
                  router.back()
                }, 1500)
              } else {
                setSnackbarMessage(`❌ ${result.error || 'Failed to send announcement'}`)
                setSnackbarVisible(true)
              }
            } catch (error: any) {
              setSnackbarMessage(`❌ ${error?.message || 'Failed to send announcement'}`)
              setSnackbarVisible(true)
            } finally {
              setSending(false)
            }
          },
        },
      ]
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.title}>
          Send Announcement
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Today's Menu"
              disabled={sending}
            />
          </Card.Content>
        </Card>

        {/* Message Input */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Message *"
              value={message}
              onChangeText={setMessage}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.input, styles.textArea]}
              placeholder="Enter your announcement message..."
              disabled={sending}
            />
          </Card.Content>
        </Card>

        {/* Image Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Image (Optional)
            </Text>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  onPress={handleRemoveImage}
                  style={styles.removeImageButton}
                  disabled={sending}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.imagePickerButton}
                disabled={sending}
              >
                <MaterialCommunityIcons name="image-plus" size={32} color="#7B2CBF" />
                <Text style={styles.imagePickerText}>Add Image</Text>
                <Text style={styles.imagePickerSubtext}>Camera or Gallery</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {/* Target Type Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Send To
            </Text>
            <View style={styles.targetButtons}>
              {(['all', 'active', 'expiring', 'expired', 'custom'] as TargetType[]).map((type) => (
                <Button
                  key={type}
                  mode={targetType === type ? 'contained' : 'outlined'}
                  onPress={() => {
                    setTargetType(type)
                    if (type !== 'custom') {
                      setSelectedStudentIds(new Set())
                      setShowStudentSelector(false)
                    } else {
                      setShowStudentSelector(true)
                    }
                  }}
                  style={styles.targetButton}
                  disabled={sending}
                  buttonColor={targetType === type ? '#7B2CBF' : undefined}
                  textColor={targetType === type ? '#FFFFFF' : '#7B2CBF'}
                >
                  {type === 'all' ? 'All Students' :
                   type === 'active' ? 'Active Only' :
                   type === 'expiring' ? 'Expiring Soon' :
                   type === 'expired' ? 'Expired' :
                   'Select Students'}
                </Button>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Student Selector (for custom) */}
        {targetType === 'custom' && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.studentSelectorHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Select Students ({selectedStudentIds.size} selected)
                </Text>
                <Button
                  mode="text"
                  onPress={() => setShowStudentSelector(!showStudentSelector)}
                  compact
                >
                  {showStudentSelector ? 'Hide' : 'Show'}
                </Button>
              </View>
              {showStudentSelector && (
                <ScrollView style={styles.studentList} nestedScrollEnabled>
                  {allStudents.map((student) => (
                    <TouchableOpacity
                      key={student.id}
                      onPress={() => handleStudentToggle(student.id)}
                      style={[
                        styles.studentItem,
                        selectedStudentIds.has(student.id) && styles.studentItemSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={selectedStudentIds.has(student.id) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={24}
                        color={selectedStudentIds.has(student.id) ? '#7B2CBF' : '#9CA3AF'}
                      />
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentEmail}>{student.email}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        )}

      </ScrollView>

      {/* Sticky Send Button */}
      <View style={[styles.stickyButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.sendButton}
          disabled={sending || !title.trim() || !message.trim()}
          loading={sending}
          buttonColor="#7B2CBF"
        >
          {sending ? 'Sending...' : 'Send Announcement'}
        </Button>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 20,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
  },
  stickyButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  imageContainer: {
    position: 'relative',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#7B2CBF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
  },
  imagePickerSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  targetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  targetButton: {
    flex: 1,
    minWidth: '45%',
  },
  studentSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentList: {
    maxHeight: 300,
    marginTop: 8,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  studentItemSelected: {
    backgroundColor: '#F3E8FF',
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sendButton: {
    borderRadius: 8,
    paddingVertical: 4,
  },
})

