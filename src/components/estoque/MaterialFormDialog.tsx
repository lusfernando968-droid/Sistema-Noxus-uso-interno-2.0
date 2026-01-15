import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { materialSchema, MaterialRecord } from "@/hooks/useMateriaisEstoque";
import { useProdutos } from "@/hooks/useProdutos";
import {
  Calendar,
  Package,
  DollarSign,
  MapPin,
  FileText,
  Building2,
  Layers,
  Scale,
  Tag,
  Info,
  Check,
  ChevronsUpDown,
  Plus
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  trigger?: React.ReactNode;
  initial?: MaterialRecord | null;
  onSubmit: (values: MaterialRecord) => Promise<void> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function MaterialFormDialog({ trigger, initial, onSubmit, open, onOpenChange }: Props) {
  const { produtos, insertProduto } = useProdutos();
  const [openCombobox, setOpenCombobox] = useState(false);

  console.log('🏗️ MaterialFormDialog renderizado, produtos:', produtos, 'length:', produtos.length);

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
      unidade_embalagem: "",
      fator_conversao: 0,
      quantidade_embalagens: 0,
    },
  });

  const handleSubmit = async (values: MaterialRecord) => {
    await onSubmit(values);
  };

  const handleSelectProduto = (produtoNome: string) => {
    console.log('🔍 handleSelectProduto chamado com:', produtoNome);
    console.log('📦 Produtos disponíveis:', produtos);

    const produto = produtos.find((p) => p.nome.trim().toLowerCase() === produtoNome.trim().toLowerCase());
    console.log('✅ Produto encontrado:', produto);

    if (produto) {
      form.setValue("nome", produto.nome);
      form.setValue("marca", produto.marca || "");
      form.setValue("tipo_material", produto.tipo_material);
      form.setValue("unidade", produto.unidade);
      form.setValue("unidade_embalagem", produto.unidade_embalagem || "");
      form.setValue("fator_conversao", produto.fator_conversao || 0);
      setOpenCombobox(false);
      console.log('✨ Campos preenchidos com sucesso!');
    } else {
      console.error('❌ Produto não encontrado na lista');
    }
  };

  const handleSaveAsProduto = async () => {
    const values = form.getValues();
    if (!values.nome || !values.tipo_material || !values.unidade) {
      return; // Validação básica, o hook fará a validação completa
    }

    try {
      await insertProduto({
        nome: values.nome,
        marca: values.marca,
        tipo_material: values.tipo_material,
        unidade: values.unidade,
        unidade_embalagem: values.unidade_embalagem,
        fator_conversao: values.fator_conversao,
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {initial ? <Info className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            {initial ? "Editar material" : "Adicionar material"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            {/* Grupo: Informações do Material */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Informações do Material
                </h3>
                {!initial && (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-[200px] justify-between h-8 text-xs"
                      >
                        Selecionar produto...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 z-[9999] pointer-events-auto">
                      <Command>
                        <CommandInput placeholder="Buscar produto..." />
                        <CommandList>
                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                          <CommandGroup>
                            {produtos.map((produto) => (
                              <CommandItem
                                key={produto.id}
                                value={produto.nome}
                                onSelect={handleSelectProduto}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("nome") === produto.nome ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {produto.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="nome" control={form.control} render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nome do material" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="marca" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Marca" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="tipo_material" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo do material</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="ex.: agulha, tinta, luva" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>

              {!initial && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={handleSaveAsProduto}
                  >
                    <Plus className="h-3 w-3" /> Salvar como Produto
                  </Button>
                </div>
              )}
            </div>

            {/* Grupo: Estoque e Custos */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Scale className="h-4 w-4" /> Estoque e Custos
              </h3>

              {/* Campos de Embalagem e Conversão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="unidade_embalagem" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Embalagem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Caixa">Caixa</SelectItem>
                        <SelectItem value="Pacote">Pacote</SelectItem>
                        <SelectItem value="Rolo">Rolo</SelectItem>
                        <SelectItem value="Frasco">Frasco</SelectItem>
                        <SelectItem value="Tubo">Tubo</SelectItem>
                        <SelectItem value="Galão">Galão</SelectItem>
                        <SelectItem value="Pote">Pote</SelectItem>
                        <SelectItem value="Sachê">Sachê</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {form.watch("unidade_embalagem") && (
                  <>
                    <FormField name="unidade" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mL">mL (mililitros)</SelectItem>
                            <SelectItem value="L">L (litros)</SelectItem>
                            <SelectItem value="g">g (gramas)</SelectItem>
                            <SelectItem value="kg">kg (quilogramas)</SelectItem>
                            <SelectItem value="un">un (unidades)</SelectItem>
                            <SelectItem value="m">m (metros)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField name="fator_conversao" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("unidade") === "mL" ? "Capacidade (mL)" :
                            form.watch("unidade") === "g" ? "Peso (g)" :
                              form.watch("unidade") === "L" ? "Capacidade (L)" :
                                "Qtd por Embalagem"}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="1"
                              placeholder="100"
                              className="pl-9"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                const fator = Number(e.target.value) || 0;
                                const qtdEmb = Number(form.getValues("quantidade_embalagens")) || 0;
                                if (fator > 0 && qtdEmb > 0) {
                                  form.setValue("quantidade", fator * qtdEmb);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField name="quantidade_embalagens" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qtd de Embalagens</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="1"
                              placeholder="1"
                              className="pl-9"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                field.onChange(e);
                                const qtdEmb = Number(e.target.value) || 0;
                                const fator = Number(form.getValues("fator_conversao")) || 0;
                                if (fator > 0 && qtdEmb > 0) {
                                  form.setValue("quantidade", fator * qtdEmb);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="quantidade" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="custo_unitario" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo unitário (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.000001" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Campo de Valor Total do Produto - calcula custo unitário automaticamente */}
                {form.watch("unidade_embalagem") && form.watch("fator_conversao") && (
                  <FormItem>
                    <FormLabel>Valor Total do {form.watch("unidade_embalagem")} (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          className="pl-9"
                          onChange={(e) => {
                            const valorTotal = Number(e.target.value) || 0;
                            const capacidade = Number(form.getValues("fator_conversao")) || 0;
                            if (capacidade > 0 && valorTotal > 0) {
                              const custoPorUnidade = valorTotal / capacidade;
                              console.log('💰 Cálculo:', { valorTotal, capacidade, custoPorUnidade, precisao: custoPorUnidade.toFixed(10) });
                              form.setValue("custo_unitario", custoPorUnidade);
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {form.watch("unidade") === "mL"
                        ? `Ex: Frasco de ${form.watch("fator_conversao") || 100} mL por R$ 50`
                        : "Valor total da embalagem"}
                    </p>
                  </FormItem>
                )}
              </div>
            </div>

            {/* Grupo: Aquisição e Validade */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Aquisição e Validade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="fornecedor" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Fornecedor" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="lote" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Layers className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Lote" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="data_aquisicao" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de aquisição</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="validade" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Grupo: Armazenamento e Detalhes */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Armazenamento e Detalhes
              </h3>
              <FormField name="local_armazenamento" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de armazenamento</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Ex.: sala 1, armário A" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="observacoes" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Textarea placeholder="Notas adicionais" className="pl-9 min-h-[80px]" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <Button type="submit">{initial ? "Salvar" : "Adicionar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
