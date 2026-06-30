import { View, Text, TextInput, TextInputProps, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

export default function Input({ label, error, isPassword, leftIcon, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>}
      <View
        className={`flex-row items-center bg-white border rounded-xl px-3 ${
          error ? "border-red-400" : "border-slate-200"
        }`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !show}
          className="flex-1 py-3 text-sm text-slate-800"
          placeholderTextColor="#94A3B8"
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShow((s) => !s)} className="p-1">
            {show ? (
              <EyeOff size={18} color="#94A3B8" />
            ) : (
              <Eye size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}
