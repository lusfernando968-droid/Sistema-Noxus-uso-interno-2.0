import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, UserPlus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Assistant = {
    id: string;
    assistant_email: string;
    created_at: string;
    assistant_id: string | null;
};

export function AssistantsSettings() {
    const navigate = useNavigate();
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        fetchAssistants();
    }, [user]);

    const fetchAssistants = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("assistants")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAssistants(data || []);
        } catch (error) {
            console.error("Error fetching assistants:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar assistentes",
                description: "Não foi possível carregar a lista de assistentes.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddAssistant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.trim()) return;

        setAdding(true);
        try {
            const { data, error } = await supabase
                .from("assistants")
                .insert([
                    {
                        user_id: user?.id,
                        assistant_email: newEmail.trim().toLowerCase(),
                    },
                ])
                .select()
                .single();

            if (error) {
                if (error.code === "23505") { // Unique violation
                    throw new Error("Este email já está cadastrado como seu assistente.");
                }
                throw error;
            }

            setAssistants([data, ...assistants]);
            setNewEmail("");
            toast({
                title: "Assistente adicionado",
                description: "O assistente poderá fazer login usando este email.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao adicionar",
                description: error.message || "Erro desconhecido ao adicionar assistente.",
            });
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAssistant = async (id: string) => {
        try {
            const { error } = await supabase
                .from("assistants")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setAssistants(assistants.filter((a) => a.id !== id));
            toast({
                title: "Assistente removido",
                description: "O acesso deste assistente foi revogado.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao remover",
                description: "Não foi possível remover o assistente.",
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Meus Assistentes
                </CardTitle>
                <CardDescription>
                    Gerencie quem tem acesso aos seus Clientes, Projetos e Agendamentos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleAddAssistant} className="flex gap-2">
                    <Input
                        placeholder="Email do assistente"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={adding}
                        className="max-w-md"
                    />
                    <Button type="submit" disabled={adding || !newEmail}>
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Adicionar</span>
                    </Button>
                </form>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : assistants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        Nenhum assistente cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                assistants.map((assistant) => (
                                    <TableRow key={assistant.id}>
                                        <TableCell className="font-medium">{assistant.assistant_email}</TableCell>
                                        <TableCell>
                                            {assistant.assistant_id ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                                    Pendente Cadastro
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/settings/assistants/${assistant.id}`)}
                                                className="mr-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90"
                                                onClick={() => handleRemoveAssistant(assistant.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
