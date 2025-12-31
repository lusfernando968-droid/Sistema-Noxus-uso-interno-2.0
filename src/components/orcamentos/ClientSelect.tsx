import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Cliente, ClientesService } from "@/services/clientes.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface ClientSelectProps {
    onSelect: (cliente: Cliente) => void;
    selectedClienteId?: string;
}

export function ClientSelect({ onSelect, selectedClienteId }: ClientSelectProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientPhone, setNewClientPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadClientes();
        }
    }, [user?.id]);

    const loadClientes = async () => {
        if (!user?.id) return;
        try {
            // Using fetchAll which handles fallback strategies
            const data = await ClientesService.fetchAll(user.id);
            setClientes(data);
        } catch (error) {
            console.error("Erro ao carregar clientes", error);
        }
    };

    const handleCreateLead = async () => {
        if (!user?.id || !newClientName.trim()) return;

        setIsLoading(true);
        try {
            const novoCliente = await ClientesService.create(user.id, {
                nome: newClientName,
                telefone: newClientPhone,
                status: 'lead'
            });

            await loadClientes();
            onSelect(novoCliente);
            toast({
                title: "Lead criado",
                description: `${novoCliente.nome} registrado como lead.`,
            });
            setCreateDialogOpen(false);
            setNewClientName("");
            setNewClientPhone("");
        } catch (error) {
            console.error("Erro ao criar lead", error);
            toast({
                title: "Erro",
                description: "Não foi possível criar o lead.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedCliente = clientes.find((c) => c.id === selectedClienteId);

    return (
        <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
                <Label>Cliente / Lead</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {selectedCliente
                                ? selectedCliente.nome
                                : "Selecione um cliente..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar cliente..." />
                            <CommandList>
                                <CommandEmpty>
                                    <div className="p-2 text-center text-sm">
                                        Nenhum cliente encontrado.
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-primary ml-1"
                                            onClick={() => {
                                                setOpen(false);
                                                setCreateDialogOpen(true);
                                            }}
                                        >
                                            Criar novo?
                                        </Button>
                                    </div>
                                </CommandEmpty>
                                <CommandGroup>
                                    {clientes.map((cliente) => (
                                        <CommandItem
                                            key={cliente.id}
                                            value={cliente.nome}
                                            onSelect={() => {
                                                onSelect(cliente);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedClienteId === cliente.id
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{cliente.nome}</span>
                                                <span className="text-xs text-muted-foreground uppercase">{cliente.status || 'lead'}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <Button
                variant="secondary"
                size="icon"
                onClick={() => setCreateDialogOpen(true)}
                title="Novo Lead Rápido"
            >
                <UserPlus className="w-4 h-4" />
            </Button>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Lead Rápido</DialogTitle>
                        <DialogDescription>
                            Cadastre um cliente em potencial (lead) para este orçamento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="lead-name">Nome</Label>
                            <Input
                                id="lead-name"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="Nome do cliente"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lead-phone">Telefone / WhatsApp</Label>
                            <Input
                                id="lead-phone"
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateLead} disabled={isLoading || !newClientName}>
                            {isLoading ? "Salvando..." : "Criar Lead"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
