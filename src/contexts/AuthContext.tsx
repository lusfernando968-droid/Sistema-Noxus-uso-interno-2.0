import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  nome_completo: string;
  avatar_url: string | null;
  telefone: string | null;
  cargo: string | null;
  color_theme?: string | null;
};

type UserRole = "admin" | "manager" | "user" | "assistant";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  checkAssistantEmail: (email: string) => Promise<boolean>;
  masterId: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(() => localStorage.getItem("noxus_user_role") as UserRole | null);
  const [masterId, setMasterId] = useState<string | null>(() => localStorage.getItem("noxus_master_id"));
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // --- NOVA LÓGICA COM RPC (Salva-vidas contra erro 403) ---
      // Verifica se já temos role/masterId em cache para evitar chamadas desnecessárias
      const cachedRole = localStorage.getItem("noxus_user_role");
      const cachedMaster = localStorage.getItem("noxus_master_id");

      if (cachedRole && cachedMaster) {
        console.log("AuthContext: Usando role/masterId do cache");
        setUserRole(cachedRole as UserRole);
        setMasterId(cachedMaster);
        return; // Retorna cedo, evita RPC
      }

      // Chama a função segura no banco que ignora RLS (com timeout reduzido)
      try {
        const { data: rpcData, error: rpcError } = await Promise.race([
          supabase.rpc('get_user_role_safe', { target_email: email || '' }),
          new Promise<{ data: null; error: Error }>((_, reject) =>
            setTimeout(() => reject({ data: null, error: new Error("RPC timeout") }), 3000)
          )
        ]);

        if (rpcData) {
          console.log("AuthContext: RPC retornou:", rpcData);
          // rpcData ex: { role: 'assistant', master_id: '...' }
          const safeRole = rpcData.role as UserRole;
          const safeMaster = rpcData.master_id;

          setUserRole(safeRole);
          setMasterId(safeMaster);

          localStorage.setItem("noxus_user_role", safeRole);
          localStorage.setItem("noxus_master_id", safeMaster);
        } else {
          console.warn("AuthContext: RPC vazio, usando fallback");
          setMasterId(userId);
          localStorage.setItem("noxus_master_id", userId);
        }
      } catch (rpcError) {
        console.warn("AuthContext: RPC falhou ou timeout, usando fallback:", rpcError);
        // Fallback: assume admin se RPC falhar
        setUserRole("admin");
        setMasterId(userId);
        localStorage.setItem("noxus_user_role", "admin");
        localStorage.setItem("noxus_master_id", userId);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // Se o Supabase não estiver configurado, evitamos subscrever e liberamos a UI
    if (!isSupabaseConfigured) {
      console.error("Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.");
      setLoading(false);
      return; // eslint-disable-line consistent-return
    }


    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await Promise.race([
              fetchProfile(session.user.id, session.user.email),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout fetching profile")), 6000))
            ]);
          } catch (error) {
            console.error("Error in onAuthStateChange:", error);
          }
        } else {
          setProfile(null);
          setUserRole(null);
          setMasterId(null);
        }

        setLoading(false);
      }
    );

    // Safety timeout: If nothing happens within 6 seconds, stop loading to allow UI to render (or error)
    const safetyTimeout = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn("Safety timeout triggered: Forcing loading to false.");
          return false;
        }
        return currentLoading;
      });
    }, 6000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          await Promise.race([
            fetchProfile(session.user.id, session.user.email),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout fetching profile")), 6000))
          ]);
        } catch (error) {
          console.error("Error in getSession:", error);
        }
      }

      clearTimeout(safetyTimeout);
      setLoading(false);
    }).catch((err) => {
      console.error("Session check error", err);
      clearTimeout(safetyTimeout);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase não configurado no ambiente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.") };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          return { error: new Error("Email ou senha incorretos") };
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase não configurado no ambiente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.") };
    }
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: nomeCompleto,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { error: new Error("Este email já está cadastrado") };
        }
        return { error };
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    setMasterId(null);
    localStorage.removeItem("noxus_user_role");
    localStorage.removeItem("noxus_master_id");
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error("Usuário não autenticado") };
    if (!isSupabaseConfigured) return { error: new Error("Supabase não configurado no ambiente.") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...data } : null);

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const checkAssistantEmail = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('check_assistant_email_exists', { target_email: email.trim() });

      if (error) {
        console.error("Error checking assistant email:", error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error("Error in checkAssistantEmail:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        masterId,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        checkAssistantEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
