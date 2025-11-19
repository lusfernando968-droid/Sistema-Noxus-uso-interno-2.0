import { useState } from "react";
import { Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIChat } from "@/components/dashboard/AIChat";

export function FloatingAIChat() {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);

  return (
    <>
      {/* Botão flutuante lateral com magnificação estilo dock */}
      <div className="fixed right-6 bottom-6 z-50">
        <div className="relative">
          {/* Glow dinâmico semelhante ao dock */}
          <div
            className={`absolute inset-0 rounded-full blur-xl transition-all duration-200 ease-out pointer-events-none -z-10 ${
              hovering ? "opacity-60 scale-125 bg-primary/25" : "opacity-0 scale-100"
            }`}
          />
          <button
            type="button"
            aria-label="Abrir chat de IA"
            onClick={() => setOpen(true)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="relative z-10 h-12 w-12 rounded-full shadow-lg border border-border bg-background flex items-center justify-center transition-all duration-200 ease-out hover:scale-125 hover:border-primary/50 hover:shadow-2xl hover:bg-primary/10 active:scale-95"
          >
            <Bot className="w-6 h-6 text-primary transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Popup posicionado próximo ao botão flutuante (canto inferior direito) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-[520px] md:w-[560px] rounded-2xl h-[80vh] sm:h-[75vh] overflow-hidden fixed right-6 bottom-24 left-auto top-auto translate-x-0 translate-y-0 shadow-2xl origin-bottom-right transition-transform duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 flex flex-col">
          <DialogHeader className="flex-shrink-0 px-3 py-2">
            <DialogTitle>Assistente IA</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex-1 min-h-0">
            <AIChat />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}