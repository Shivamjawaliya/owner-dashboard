import { View, ViewProps } from "react-native";

interface Props extends ViewProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = "", padding = true, style, ...props }: Props) {
  return (
    <View
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${
        padding ? "p-4" : ""
      } ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
