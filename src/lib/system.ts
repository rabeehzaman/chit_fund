// Use a valid UUID format to match common DB schemas
export const SYSTEM_PROFILE_ID = "00000000-0000-0000-0000-000000000000"
export const SYSTEM_PROFILE_NAME = "System Administrator"
export const SYSTEM_PROFILE_ROLE = "admin"

// Best-effort: ensure a system profile exists to satisfy FKs
export async function ensureSystemProfile(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', SYSTEM_PROFILE_ID)
      .single()

    if (!error && data?.id === SYSTEM_PROFILE_ID) return
  } catch (e: any) {
    // If not found, Postgrest returns PGRST116; ignore and proceed to insert
  }

  try {
    await supabase.from('profiles').insert({
      id: SYSTEM_PROFILE_ID,
      full_name: SYSTEM_PROFILE_NAME,
      role: SYSTEM_PROFILE_ROLE,
      is_active: true,
    })
  } catch (_) {
    // Non-fatal; continue without blocking UI
  }
}

// Attempts to get a usable profile id for FKs (system id or any existing one)
export async function getAnyProfileId(supabase: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', SYSTEM_PROFILE_ID)
      .single()

    if (!error && data?.id) return data.id
  } catch (_) {}

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (!error && data?.id) return (data as any).id
  } catch (_) {}
  return null
}
