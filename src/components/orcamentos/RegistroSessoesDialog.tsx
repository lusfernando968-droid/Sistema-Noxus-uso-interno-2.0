import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardList, Trash2, CheckSquare } from "lucide-react";
import { format } from "date-fns";

export interface OrcamentoRegistro {
    id: string;
    cliente: string; // Nome do cliente
    clienteId?: string; // ID do cliente para efetivação
    dataCriacao: Date;
    tamanho: number;
    estilo: string;
    cor: string;
    locais: string[];
    tempoEstimado: number;
    valorEstimado: number;
}

interface RegistroSessoesDialogProps {
    registros: OrcamentoRegistro[];
    onDelete?: (id: string) => void;
    onEfetivar?: (registro: OrcamentoRegistro) => void;
}

export function RegistroSessoesDialog({ registros, onDelete, onEfetivar }: RegistroSessoesDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Registro de Sessões
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl rounded-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registro de Sessões</DialogTitle>
                    <DialogDescription>
                        Histórico de orçamentos e estimativas geradas.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md border mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estilo</TableHead>
                                <TableHead>Tamanho</TableHead>
                                <TableHead>Locais</TableHead>
                                <TableHead>Tempo Est.</TableHead>
                                <TableHead>Valor Sugerido</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registros.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                registros.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell>
                                            {format(reg.dataCriacao, "dd/MM/yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell className="font-medium text-primary">
                                            {reg.cliente}
                                        </TableCell>
                                        <TableCell className="capitalize">{reg.estilo}</TableCell>
                                        <TableCell>{reg.tamanho} cm</TableCell>
                                        <TableCell className="capitalize">
                                            {reg.locais.join(", ") || "-"}
                                        </TableCell>
                                        <TableCell>{reg.tempoEstimado}h</TableCell>
                                        <TableCell className="font-medium text-green-600">
                                            {reg.valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {onEfetivar && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEfetivar(reg)}
                                                        title="Efetivar (Criar Projeto)"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    >
                                                        <CheckSquare className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {onDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete(reg.id)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
