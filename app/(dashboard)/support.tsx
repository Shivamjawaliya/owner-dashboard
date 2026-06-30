import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";
import { HelpCircle, MessageCircle, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUIStore } from "@/store/ui.store";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const FAQS = [
  { q: "How do I add a new building?",             a: "Go to Buildings → tap the '+' button → fill in the property details and save." },
  { q: "How do I record a payment?",               a: "Navigate to Payments → find the resident → tap 'Mark as Paid' and select the payment method." },
  { q: "Can I have multiple buildings?",           a: "Yes! PG Owner supports unlimited buildings under one account. Upgrade to a premium plan for advanced analytics." },
  { q: "How do I assign a room to a resident?",   a: "Go to Residents → Add Resident → fill in the room allocation details during onboarding." },
  { q: "How do I export reports?",                 a: "Go to Reports → scroll to bottom → tap 'Export Report (PDF)' to download." },
];

export default function SupportScreen() {
  const { top } = useSafeAreaInsets();
  const { toggleSidebar } = useUIStore();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in both subject and message.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSubject("");
    setMessage("");
    Alert.alert("Sent!", "We'll get back to you within 24 hours.");
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-100 px-4 pb-3" style={{ paddingTop: top + 8 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleSidebar} className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center mr-3">
            <HelpCircle size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800">Help & Support</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View className="flex-row gap-3">
          {[
            { label: "Live Chat", icon: MessageCircle, color: "#2563EB", bg: "#EFF6FF" },
            { label: "Call Us",   icon: Phone,         color: "#22C55E", bg: "#F0FDF4" },
            { label: "Email",     icon: Mail,          color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <TouchableOpacity
                key={c.label}
                className="flex-1 rounded-2xl py-4 items-center border border-slate-100"
                style={{ backgroundColor: c.bg }}
              >
                <Icon size={22} color={c.color} />
                <Text className="text-xs font-semibold mt-2" style={{ color: c.color }}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAQs */}
        <View>
          <Text className="font-bold text-slate-800 text-base mb-3">Frequently Asked Questions</Text>
          <View className="gap-2">
            {FAQS.map((faq, i) => {
              const isOpen = expandedFaq === i;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setExpandedFaq(isOpen ? null : i)}
                >
                  <Card>
                    <View className="flex-row items-start">
                      <Text className="text-sm font-semibold text-slate-800 flex-1 mr-2">{faq.q}</Text>
                      {isOpen
                        ? <ChevronUp size={16} color="#94A3B8" />
                        : <ChevronDown size={16} color="#94A3B8" />
                      }
                    </View>
                    {isOpen && (
                      <Text className="text-sm text-slate-500 mt-3 leading-5">{faq.a}</Text>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Contact Form */}
        <Card>
          <Text className="font-bold text-slate-800 mb-4">Send us a message</Text>
          <View className="mb-3">
            <Text className="text-sm font-medium text-slate-700 mb-1.5">Subject</Text>
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <TextInput
                placeholder="Describe your issue briefly"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
                className="text-sm text-slate-800"
              />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-1.5">Message</Text>
            <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <TextInput
                placeholder="Tell us more about your problem..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                className="text-sm text-slate-800 min-h-[100px]"
              />
            </View>
          </View>
          <Button label="Send Message" onPress={sendMessage} loading={sending} fullWidth />
        </Card>

        <View className="items-center py-4">
          <Text className="text-slate-400 text-xs">PG Owner v1.0.0</Text>
          <Text className="text-slate-400 text-xs mt-0.5">© 2024 PG Owner. All rights reserved.</Text>
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
