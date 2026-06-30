import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-blue-600 border-blue-600", text: "text-white" },
  outline: { container: "bg-transparent border-blue-600",      text: "text-blue-600" },
  ghost:   { container: "bg-transparent border-transparent",   text: "text-slate-700" },
  danger:  { container: "bg-red-500 border-red-500",           text: "text-white" },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: "px-3 py-1.5 rounded-md",  text: "text-sm" },
  md: { container: "px-4 py-2.5 rounded-lg",  text: "text-sm" },
  lg: { container: "px-6 py-3.5 rounded-xl",  text: "text-base" },
};

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth,
}: Props) {
  const { container: vc, text: vt } = variantStyles[variant];
  const { container: sc, text: st } = sizeStyles[size];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`border flex-row items-center justify-center ${vc} ${sc} ${
        fullWidth ? "w-full" : ""
      } ${disabled || loading ? "opacity-50" : ""}`}
    >
      {loading && <ActivityIndicator size="small" color="#fff" className="mr-2" />}
      <Text className={`font-semibold ${vt} ${st}`}>{label}</Text>
    </TouchableOpacity>
  );
}
