import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { materialSchema, MaterialRecord } from "@/hooks/useMateriaisEstoque";

type Props = {
  trigger?: React.ReactNode;
  initial?: MaterialRecord | null;
  onSubmit: (values: MaterialRecord) => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function MaterialFormDialog({ trigger, initial, onSubmit, open, onOpenChange }: Props) {
  const form = useForm<MaterialRecord>({
    resolver: zodResolver(materialSchema as any),
    defaultValues: initial || {
      data_aquisicao: "",
      tipo_material: "",
      nome: "",
      marca: "",
      fornecedor: "",
      quantidade: 0,
      unidade: "un",
      custo_unitario: 0,
      lote: "",
      validade: "",
      local_armazenamento: "",
      observacoes: "",
    },
  });

  const handleSubmit = async (values: MaterialRecord) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar material" : "Adicionar material"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="data_aquisicao" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de aquisição</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="tipo_material" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo do material</FormLabel>
                  <FormControl>
                    <Input placeholder="ex.: agulha, tinta, luva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="nome" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do material" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="marca" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input placeholder="Marca" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="fornecedor" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Fornecedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="lote" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Lote</FormLabel>
                  <FormControl>
                    <Input placeholder="Lote" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="validade" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="quantidade" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="unidade" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <FormControl>
                    <Input placeholder="un, ml, g" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="custo_unitario" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo unitário (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField name="local_armazenamento" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Local de armazenamento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: sala 1, armário A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="observacoes" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Notas adicionais" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="submit">{initial ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
