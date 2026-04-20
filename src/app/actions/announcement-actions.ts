"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"

import { sendPushNotification } from "@/lib/firebase-admin"

export type AnnouncementType = 'info' | 'warning' | 'important'

export async function getAnnouncements() {
  const { data, error } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching announcements:", error)
    return []
  }
  return data || []
}

export async function createAnnouncement(formData: { 
  title: string, 
  content: string, 
  type: string,
  is_active: boolean 
}) {
  try {
    const { error } = await supabaseAdmin
      .from("announcements")
      .insert([formData])
    
    if (error) throw error
    
    // Kirim Push Notification jika pengumuman aktif
    if (formData.is_active) {
      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("token")
      
      if (subs && subs.length > 0) {
        const tokens = subs.map(s => s.token)
        await sendPushNotification(
          tokens, 
          `PPMH: ${formData.title}`, 
          formData.content.substring(0, 100) + (formData.content.length > 100 ? '...' : ''),
          { type: 'announcement' }
        )
      }
    }

    revalidatePath("/admin/announcements")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateAnnouncement(id: string, formData: { 
  title: string, 
  content: string, 
  type: string,
  is_active: boolean 
}) {
  try {
    const { error } = await supabaseAdmin
      .from("announcements")
      .update(formData)
      .eq("id", id)
    
    if (error) throw error
    
    revalidatePath("/admin/announcements")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("announcements")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    revalidatePath("/admin/announcements")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleAnnouncementStatus(id: string, isActive: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ is_active: isActive })
      .eq("id", id)
    
    if (error) throw error
    
    revalidatePath("/admin/announcements")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
