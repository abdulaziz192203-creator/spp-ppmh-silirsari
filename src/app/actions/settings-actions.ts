"use client"

import { supabase } from "@/lib/supabase"

export async function getSettings() {
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
  
  if (error) {
    console.error("Error fetching settings:", error)
    return {}
  }

  // Transform array to key-value object
  return data.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {})
}

export async function updateSetting(key: string, value: string) {
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() })
  
  if (error) {
    console.error(`Error updating setting ${key}:`, error)
    throw error
  }
}

export async function updateMultipleSettings(settings: Record<string, string>) {
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from("system_settings")
    .upsert(updates)
  
  if (error) {
    console.error("Error updating multiple settings:", error)
    throw error
  }
}
