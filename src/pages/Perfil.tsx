import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { useSoundContext } from "@/contexts/SoundContext";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Camera, Loader2, Menu, Eye, EyeOff, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ColorInput } from "@/components/ui/color-input";

export default function Perfil() {
  const { profile, userRole, updateProfile, user } = useAuth();
  const { colorTheme, setColorTheme, customColor, setCustomColor } = useTheme();
  const { navigationType, setNavigationType, isNavigationVisible, setIsNavigationVisible } = useNavigation();
  const { isSoundEnabled, setIsSoundEnabled } = useSoundContext();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const colorThemes = [
    { id: "default" as const, name: "Roxo Padrão", colors: "bg-gradient-to-r from-purple-500 to-purple-600" },
    { id: "ocean" as const, name: "Oceano", colors: "bg-gradient-to-r from-cyan-500 to-blue-500" },
    { id: "sunset" as const, name: "Pôr do Sol", colors: "bg-gradient-to-r from-orange-500 to-pink-500" },
    { id: "forest" as const, name: "Floresta", colors: "bg-gradient-to-r from-green-600 to-emerald-500" },
    { id: "purple" as const, name: "Violeta", colors: "bg-gradient-to-r from-violet-500 to-purple-500" },
    { id: "rose" as const, name: "Rosa", colors: "bg-gradient-to-r from-rose-500 to-pink-500" },
    { id: "black" as const, name: "Preto", colors: "bg-gradient-to-r from-gray-900 to-black" },
    { id: "custom" as const, name: "Personalizada", colors: "bg-gradient-to-r from-gray-400 to-gray-600" },
  ];

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      nome_completo: profile?.nome_completo || "",
      telefone: profile?.telefone || "",
      cargo: profile?.cargo || "",
    },
  });

  const onSubmit = async (data: ProfileUpdateInput) => {
    setIsLoading(true);
    await updateProfile(data);
    setIsLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    const file = event.target.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 2MB",
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: "Não foi possível enviar a imagem",
      });
    } finally {
      setUploading(false);
    }
  };

  const roleLabels = {
    admin: "Administrador",
    manager: "Gerente",
    user: "Usuário",
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Clique na foto para alterar</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                name={profile.nome_completo}
                className="h-24 w-24"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
            <div>
              <p className="font-medium text-lg">{profile.nome_completo}</p>
              {userRole && (
                <Badge variant="secondary" className="mt-2">
                  {roleLabels[userRole]}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu cargo na empresa"
                          className="rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Tema de Cores</CardTitle>
            <CardDescription>Escolha a paleta de cores do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {colorThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setColorTheme(theme.id)}
                  className={`relative group rounded-xl p-4 border-2 transition-all ${
                    colorTheme === theme.id
                      ? "border-primary scale-105"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`w-full h-20 rounded-lg ${theme.colors} mb-3`} />
                  <p className="font-medium text-sm text-center">{theme.name}</p>
                  {colorTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Seletor de Cor Personalizada */}
            {colorTheme === "custom" && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cor Personalizada</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Escolha uma cor personalizada para o sistema
                    </p>
                  </div>
                  <ColorInput
                    label="Cor Principal"
                    defaultValue={customColor}
                    onChange={(color) => setCustomColor(color)}
                    showOpacity={false}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Preferências de Navegação</CardTitle>
            <CardDescription>Configure como você deseja visualizar o menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Tipo de Menu</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha entre menu dock (inferior) ou barra lateral
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={navigationType === "dock" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNavigationType("dock")}
                  className="rounded-xl"
                >
                  Dock
                </Button>
                <Button
                  variant={navigationType === "sidebar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNavigationType("sidebar")}
                  className="rounded-xl"
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Sidebar
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Visibilidade do Menu</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar ou ocultar o menu de navegação
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isNavigationVisible ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isNavigationVisible}
                  onCheckedChange={setIsNavigationVisible}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Efeitos Sonoros</Label>
                <p className="text-sm text-muted-foreground">
                  Ativar ou desativar sons de interação
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isSoundEnabled}
                  onCheckedChange={setIsSoundEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
