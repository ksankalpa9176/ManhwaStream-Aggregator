import { supabase } from './supabase';
import { UserAccount, SourceId } from '../types';

function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${clean}@manhwastream.app`;
}


export async function fetchCurrentUser(): Promise<UserAccount | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, preferred_source, created_at')
    .eq('id', user.id)
    .maybeSingle();

  return {
    uid: user.id,
    username: profile?.username || user.user_metadata?.username || 'Reader',
    email: user.email || '',
    preferredSource: (profile?.preferred_source as SourceId) || 'all',
    sequentialCatchUp: true,
    createdAt: profile?.created_at || user.created_at,
  };
}

export async function registerWithUsername(
  username: string,
  password: string,
  preferredSource: SourceId = 'all'
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const clean = username.trim();
  if (clean.length < 3) return { success: false, error: 'Username must be at least 3 characters.' };
  if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

  const email = usernameToEmail(clean);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: clean, preferred_source: preferredSource } },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { success: false, error: 'Username is already taken.' };
    }
    return { success: false, error: error.message };
  }
  if (!data.user) return { success: false, error: 'Registration failed.' };

  return {
    success: true,
    user: {
      uid: data.user.id,
      username: clean,
      email,
      preferredSource,
      sequentialCatchUp: true,
      createdAt: data.user.created_at,
    },
  };
}

export async function loginWithUsername(
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const email = usernameToEmail(username.trim());
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { success: false, error: 'Incorrect username or password.' };
  }

  const user = await fetchCurrentUser();
  return user
    ? { success: true, user }
    : { success: false, error: 'Could not load profile.' };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}

export async function updatePreferredSource(uid: string, source: SourceId): Promise<void> {
  await supabase.from('profiles').update({ preferred_source: source }).eq('id', uid);
}

export function onAuthStateChange(callback: (user: UserAccount | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = await fetchCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
}
