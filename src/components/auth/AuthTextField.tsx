import React from 'react';
import { TextInput, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  editable?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  editable = true,
  returnKeyType,
  onSubmitEditing,
}: Props) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Txt
        variant="label"
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: TOKENS.outline,
          marginBottom: 8,
        }}
      >
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={TOKENS.outline}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        editable={editable}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        style={{
          borderWidth: 1,
          borderColor: TOKENS['outline-variant'],
          backgroundColor: TOKENS['surface-container-lowest'],
          borderRadius: RADIUS.card,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          fontFamily: 'Hanken Grotesk',
          color: TOKENS['on-background'],
          opacity: editable ? 1 : 0.6,
        }}
      />
    </View>
  );
}
