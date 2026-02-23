import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { formatPhone, formatDate, formatNumeric, formatNPK } from '@/lib/formatters';

import { TTSButton } from './TTSButton';
import { useApp } from '@/lib/AppContext';

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
  autoAdvanceLength?: number;
  autoAdvanceDelay?: number;
  inputRef?: React.RefObject<TextInput>;
  type?: 'phone' | 'date' | 'number' | 'text' | 'npk';
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
  autoAdvanceLength,
  autoAdvanceDelay = 1000,
  inputRef: externalRef,
  type = 'text',
}: StepInputProps) {
  const { language } = useApp();
  const internalRef = useRef<TextInput>(null);
  const ref = externalRef || internalRef;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAdvancedRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    hasAdvancedRef.current = false;
  }, [label]);

  useEffect(() => {
    if (autoFocus && editable) {
      const timer = setTimeout(() => {
        (ref as React.RefObject<TextInput>).current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, editable, label]);

  const handleChange = useCallback((text: string) => {
    let formatted = text;
    if (type === 'phone') {
      formatted = formatPhone(text);
    } else if (type === 'date') {
      formatted = formatDate(text);
    } else if (type === 'number') {
      formatted = formatNumeric(text);
    } else if (type === 'npk') {
      formatted = formatNPK(text);
    }

    onChangeText(formatted);

    if (!onSubmitRef.current || hasAdvancedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const isComplete = autoAdvanceLength ? formatted.length >= autoAdvanceLength : false;

    if (isComplete) {
      hasAdvancedRef.current = true;
      debounceRef.current = setTimeout(() => {
        onSubmitRef.current?.();
      }, 300);
      return;
    }

    if (formatted.length > 0 && !multiline) {
      debounceRef.current = setTimeout(() => {
        if (!hasAdvancedRef.current) {
          hasAdvancedRef.current = true;
          onSubmitRef.current?.();
        }
      }, autoAdvanceDelay);
    }
  }, [onChangeText, autoAdvanceLength, autoAdvanceDelay, type, multiline]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <TTSButton text={label} language={language} size={18} />
      </View>
      <View style={styles.inputRow}>
        <TextInput
          ref={ref as React.RefObject<TextInput>}
          style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' as const }, !editable && styles.disabled]}
          value={value}
          onChangeText={handleChange}
          keyboardType={
            type === 'phone' ? 'phone-pad' :
              (type === 'number' || type === 'npk') ? 'decimal-pad' :
                keyboardType
          }
          placeholder={placeholder || (type === 'date' ? 'YYYY-MM-DD' : type === 'npk' ? 'N:P:K' : '')}
          placeholderTextColor={Colors.textLight}
          editable={editable}
          multiline={multiline}
          returnKeyType={returnKeyType}
          maxLength={type === 'phone' ? 10 : autoAdvanceLength}
          onSubmitEditing={() => {
            if (onSubmitRef.current && value.length > 0 && !hasAdvancedRef.current) {
              hasAdvancedRef.current = true;
              onSubmitRef.current();
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
  const { language } = useApp();
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <TTSButton text={label} language={language} size={18} />
      </View>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.textSecondary,
    flex: 1,
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
