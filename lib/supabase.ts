import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "./database.types";

const CHUNK_SIZE = 1800;

const ExpoSecureStoreAdapter = {
  async getItem(key: string) {
    const count = await SecureStore.getItemAsync(`${key}__count`);
    if (count === null) return SecureStore.getItemAsync(key);
    const chunks: string[] = [];
    for (let i = 0; i < parseInt(count); i++) {
      const chunk = await SecureStore.getItemAsync(`${key}__${i}`);
      if (chunk === null) return null;
      chunks.push(chunk);
    }
    return chunks.join("");
  },
  async setItem(key: string, value: string) {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.deleteItemAsync(`${key}__count`);
      return SecureStore.setItemAsync(key, value);
    }
    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__count`, String(chunks));
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(`${key}__${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
  },
  async removeItem(key: string) {
    const count = await SecureStore.getItemAsync(`${key}__count`);
    if (count !== null) {
      for (let i = 0; i < parseInt(count); i++) {
        await SecureStore.deleteItemAsync(`${key}__${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}__count`);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
