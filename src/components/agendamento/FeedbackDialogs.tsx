import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";

interface FeedbackPromptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmWithoutFeedback: () => void;
  onConfirmWithFeedback: () => void;
}

export function FeedbackPromptDialog({
  isOpen,
  onOpenChange,
  onConfirmWithoutFeedback,
  onConfirmWithFeedback,
}: FeedbackPromptDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar sessão</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Deseja registrar o feedback da sessão?</p>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="rounded-xl" onClick={onConfirmWithoutFeedback}>
            Não, apenas confirmar
          </Button>
          <Button className="rounded-xl" onClick={onConfirmWithFeedback}>
            Sim, registrar feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FeedbackFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackCliente: string;
  onFeedbackChange: (value: string) => void;
  observacoesTecnicas: string;
  onObservacoesChange: (value: string) => void;
  avaliacao: number;
  onAvaliacaoChange: (value: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function FeedbackFormDialog({
  isOpen,
  onOpenChange,
  feedbackCliente,
  onFeedbackChange,
  observacoesTecnicas,
  onObservacoesChange,
  avaliacao,
  onAvaliacaoChange,
  onCancel,
  onSubmit,
}: FeedbackFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Registrar feedback da sessão</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Avaliação</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onAvaliacaoChange(n)}
                className="p-1"
                aria-label={`Avaliar ${n} estrela${n > 1 ? 's' : ''}`}
              >
                <Star className={`w-5 h-5 ${n <= avaliacao ? 'text-yellow-400' : 'text-muted-foreground'}`} />
              </button>
            ))}
            <span className="text-sm text-muted-foreground">{avaliacao} estrelas</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Feedback do cliente</Label>
          <Textarea
            value={feedbackCliente}
            onChange={(e) => onFeedbackChange(e.target.value)}
            rows={4}
            className="rounded-xl"
            placeholder="Como foi a experiência do cliente? Observações, satisfação, etc."
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label>Observações Técnicas</Label>
          <Textarea
            value={observacoesTecnicas}
            onChange={(e) => onObservacoesChange(e.target.value)}
            rows={3}
            className="rounded-xl"
            placeholder="Procedimentos, materiais, etapas realizadas, notas internas..."
          />
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="rounded-xl" onClick={onCancel}>
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={onSubmit}>
            Salvar e confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

