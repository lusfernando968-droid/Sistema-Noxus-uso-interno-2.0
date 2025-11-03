import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Home, Users, Briefcase, Calendar, DollarSign, Package, 
  Heart, Star, Zap, Crown, Gem, Rocket, Trophy, Target,
  Coffee, Music, Camera, Palette, Brush, Scissors,
  Sparkles, Sun, Moon, Cloud, Flower, Leaf, Edit2
} from "lucide-react";

const iconOptions = [
  { icon: Home, name: "Casa" },
  { icon: Users, name: "Usuários" },
  { icon: Briefcase, name: "Maleta" },
  { icon: Calendar, name: "Calendário" },
  { icon: DollarSign, name: "Dinheiro" },
  { icon: Package, name: "Pacote" },
  { icon: Heart, name: "Coração" },
  { icon: Star, name: "Estrela" },
  { icon: Zap, name: "Raio" },
  { icon: Crown, name: "Coroa" },
  { icon: Gem, name: "Gema" },
  { icon: Rocket, name: "Foguete" },
  { icon: Trophy, name: "Troféu" },
  { icon: Target, name: "Alvo" },
  { icon: Coffee, name: "Café" },
  { icon: Music, name: "Música" },
  { icon: Camera, name: "Câmera" },
  { icon: Palette, name: "Paleta" },
  { icon: Brush, name: "Pincel" },
  { icon: Scissors, name: "Tesoura" },
  { icon: Sparkles, name: "Brilhos" },
  { icon: Sun, name: "Sol" },
  { icon: Moon, name: "Lua" },
  { icon: Cloud, name: "Nuvem" },
  { icon: Flower, name: "Flor" },
  { icon: Leaf, name: "Folha" },
];

interface IconSelectorProps {
  selectedIcon: string;
  onIconChange: (iconName: string) => void;
  size?: "sm" | "md" | "lg";
}

export function IconSelector({ selectedIcon, onIconChange, size = "md" }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.name === iconName);
    return iconOption ? iconOption.icon : Home;
  };

  const SelectedIcon = getIconComponent(selectedIcon);

  const iconSize = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  }[size];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
          <Edit2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Escolha um ícone</h4>
          <div className="grid grid-cols-6 gap-2">
            {iconOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedIcon === option.name;
              
              return (
                <Button
                  key={option.name}
                  variant={isSelected ? "default" : "ghost"}
                  size="icon"
                  className="rounded-xl"
                  onClick={() => {
                    onIconChange(option.name);
                    setIsOpen(false);
                  }}
                  title={option.name}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { iconOptions };