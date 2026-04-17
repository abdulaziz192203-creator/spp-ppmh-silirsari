"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"

export async function createStudentWithAuth(formData: {
  name: string
  nisn: string
  class_room: string
  address: string
  password?: string
  parent_name?: string
  parent_phone?: string
}) {
  try {
    const { name, nisn, class_room, address, password, parent_name, parent_phone } = formData
    const loginEmail = `${nisn}@spp-ppmh.id`
    const loginPassword = password || `santri${nisn}` // Default password

    // 1. Create the Auth User using Service Role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: loginEmail,
      password: loginPassword,
      email_confirm: true,
      user_metadata: { 
        full_name: name,
        role: 'parent',
        nisn: nisn
      }
    })

    if (authError) {
      console.error("Auth Error:", authError.message)
      throw new Error(`Gagal membuat akun login: ${authError.message}`)
    }

    const userId = authData.user.id

    // 2. Create profile manually (trigger sudah dihapus)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert([{
        id: userId,
        role: 'parent',
        nisn: nisn,
        full_name: parent_name || `Orang Tua ${name}`
      }])

    if (profileError) {
      console.error("Profile Error:", profileError.message)
      // Cleanup: Delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Gagal membuat profil: ${profileError.message}`)
    }

    // 3. Insert into the students table
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .insert([
        { 
          name, 
          nisn, 
          class_room, 
          address,
          parent_name,
          parent_phone,
          parent_id: userId
        }
      ])

    if (studentError) {
      console.error("Student Insert Error:", studentError.message)
      // Cleanup: Delete the auth user and profile if student creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw new Error(`Gagal menyimpan data santri: ${studentError.message}`)
    }

    revalidatePath("/admin/students")
    return { 
      success: true, 
      message: `Santri "${name}" berhasil didaftarkan!\nNISN: ${nisn}\nPassword: ${loginPassword}` 
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteStudentWithAuth(studentId: string, parentId: string) {
  try {
    // 1. Delete from students table
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .delete()
      .eq("id", studentId)

    if (studentError) throw new Error(`Gagal menghapus data santri: ${studentError.message}`)

    if (parentId) {
      // 2. Delete from profiles
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", parentId)
      
      if (profileError) console.error("Profile cleanup error:", profileError.message)

      // 3. Delete from Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(parentId)
      if (authError) console.error("Auth cleanup error:", authError.message)
    }

    revalidatePath("/admin/students")
    return { success: true, message: "Santri dan akun berhasil dihapus!" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateStudent(studentId: string, formData: {
  name: string
  class_room: string
  address: string
  parent_name?: string
  parent_phone?: string
  parentId?: string
}) {
  try {
    const { name, class_room, address, parent_name, parent_phone, parentId } = formData

    // 1. Update students table
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .update({ name, class_room, address, parent_name, parent_phone })
      .eq("id", studentId)

    if (studentError) throw new Error(`Gagal update data santri: ${studentError.message}`)

    // 2. Update profile name if parentId exists
    if (parentId && parent_name) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: parent_name })
        .eq("id", parentId)
      
      // Update Auth metadata
      await supabaseAdmin.auth.admin.updateUserById(parentId, {
        user_metadata: { full_name: name }
      })
    }

    revalidatePath("/admin/students")
    return { success: true, message: "Data santri berhasil diperbarui!" }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
