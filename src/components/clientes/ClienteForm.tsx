import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { CitySelector } from "./CitySelector";
import { Plus, User, Mail, Phone, Instagram, Calendar, UserPlus, MapPin } from "lucide-react";
import type { ClienteFormData, CidadeOption, ClienteComLTV } from "@/hooks/useClientes";

interface ClienteFormProps {
  clientes: ClienteComLTV[];
  availableCities: CidadeOption[];
  cityUsageCounts: Record<string, number>;
  onSubmit: (formData: ClienteFormData, selectedCities: CidadeOption[], cityQuery: string) => Promise<boolean>;
  initialFormData: ClienteFormData;
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClienteForm({
  clientes,
  availableCities,
  cityUsageCounts,
  onSubmit,
  initialFormData,
  triggerButton,
  isOpen: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ClienteFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
  const [selectedCities, setSelectedCities] = useState<CidadeOption[]>([]);
  const [cityQuery, setCityQuery] = useState("");

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedCities([]);
    setCityQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData, selectedCities, cityQuery);
    if (success) {
      resetForm();
      setIsOpen(false);
    }
  };

  const defaultTrigger = (
    <Button className="rounded-lg gap-2 h-9 px-3">
      <Plus className="w-4 h-4" />
      <span className="hidden sm:inline">Novo Cliente</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton !== undefined ? (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5" />
            Novo Cliente
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grupo: Informações de Contato */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" /> Informações de Contato
            </h3>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="nome" 
                  className="rounded-xl pl-9" 
                  value={formData.nome} 
                  onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                  required 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    className="rounded-xl pl-9" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="telefone" 
                    className="rounded-xl pl-9" 
                    value={formData.telefone} 
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram (link)</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="instagram" 
                  placeholder="https://instagram.com/usuario" 
                  className="rounded-xl pl-9" 
                  value={formData.instagram} 
                  onChange={e => setFormData({ ...formData, instagram: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Grupo: Data de Aniversário */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Data de Aniversário
            </h3>
            <div className="space-y-2">
              <Label htmlFor="data_aniversario">Data de Aniversário (opcional)</Label>
              <DatePickerInput
                value={formData.data_aniversario}
                onChange={(date) => setFormData({ ...formData, data_aniversario: date })}
                placeholder="dd/mm/aaaa"
              />
            </div>
          </div>

          {/* Grupo: Localização */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Localização
            </h3>
            <CitySelector
              selectedCities={selectedCities}
              setSelectedCities={setSelectedCities}
              availableCities={availableCities}
              cityUsageCounts={cityUsageCounts}
              showIcon={false}
            />
          </div>

          {/* Grupo: Indicação */}
          <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Indicação
            </h3>
            <div className="space-y-2">
              <Label htmlFor="indicado_por">Indicado por (opcional)</Label>
              <Select 
                value={formData.indicado_por} 
                onValueChange={value => setFormData({ ...formData, indicado_por: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione o cliente que indicou" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Nenhum (cliente direto)</SelectItem>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-xl">
            Salvar Cliente
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

