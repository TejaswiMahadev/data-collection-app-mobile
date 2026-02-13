import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface StepInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad';
  placeholder?: string;
  editable?: boolean;
  rightIcon?: string;
  onRightPress?: () => void;
  multiline?: boolean;
  onSubmit?: () => void;
  autoFocus?: boolean;
  returnKeyType?: 'done' | 'next' | 'go';
}

export function StepInput({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
  editable = true,
  rightIcon,
  onRightPress,
  multiline,
  onSubmit,
  autoFocus = false,
  returnKeyType = 'next',
}: StepInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus && editable) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, editable]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' as const }, !editable && styles.disabled]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          editable={editable}
          multiline={multiline}
          returnKeyType={returnKeyType}
          onSubmitEditing={() => {
            if (onSubmit && value.length > 0) {
              onSubmit();
            }
          }}
          blurOnSubmit={true}
        />
        {rightIcon && onRightPress && (
          <Pressable style={styles.rightBtn} onPress={onRightPress}>
            <Ionicons name={rightIcon as any} size={22} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface StepPickerProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}

export function StepPicker({ label, value, options, onSelect }: StepPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.option, value === opt.value && styles.optionSelected]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.optionText, value === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: Colors.text,
  },
  disabled: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.textSecondary,
  },
  rightBtn: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.white,
  },
});
