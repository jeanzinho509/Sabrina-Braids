"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { BookOpen, ShoppingBag, Heart, CalendarHeart, GraduationCap, CheckSquare, Plus } from "lucide-react";
import { useState } from "react";

export default function MinhaRotinaPage() {
  const [categories] = useState([
    {
      id: "faculdade",
      title: "Faculdade & Estudos",
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-100",
      items: [
        { id: 1, text: "Estudar para a prova de marketing", done: false },
        { id: 2, text: "Ler capítulo 4", done: true }
      ]
    },
    {
      id: "devocional",
      title: "Devocional",
      icon: BookOpen,
      color: "text-purple-600",
      bg: "bg-purple-100",
      items: [
        { id: 1, text: "Leitura do dia: Salmos", done: true },
        { id: 2, text: "Oração da manhã", done: true }
      ]
    },
    {
      id: "compras",
      title: "Lista de Compras",
      icon: ShoppingBag,
      color: "text-green-600",
      bg: "bg-green-100",
      items: [
        { id: 1, text: "Frutas e verduras", done: false },
        { id: 2, text: "Leite de amêndoas", done: false }
      ]
    },
    {
      id: "compromissos",
      title: "Compromissos Pessoais",
      icon: CalendarHeart,
      color: "text-rose-600",
      bg: "bg-rose-100",
      items: [
        { id: 1, text: "Almoço com a mãe domingo", done: false },
        { id: 2, text: "Médico às 14h sexta", done: false }
      ]
    },
    {
      id: "pessoal",
      title: "Metas Pessoais & Saúde",
      icon: Heart,
      color: "text-orange-600",
      bg: "bg-orange-100",
      items: [
        { id: 1, text: "Beber 2L de água", done: true },
        { id: 2, text: "Academia 3x na semana", done: false }
      ]
    }
  ]);

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Minha Rotina</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Seu espaço pessoal para organizar a vida além do salão.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-[#e8dcc8] flex items-center justify-between bg-[#fcfbf9]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${cat.bg}`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h3 className="font-bold text-[#1a1513]">{cat.title}</h3>
              </div>
            </div>
            
            <div className="p-5 flex-1 bg-white">
              <ul className="space-y-3">
                {cat.items.map(item => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                      item.done 
                      ? "bg-[#8c6b52] border-[#8c6b52]" 
                      : "border-[#c8a58a]"
                    }`}>
                      {item.done && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${item.done ? "text-[#a08f86] line-through" : "text-[#5c4737]"}`}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border-t border-[#f0e6da]">
              <button className="w-full py-2 text-sm font-medium text-[#8c6b52] hover:bg-[#fcfbf9] rounded-lg transition-colors flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Adicionar item
              </button>
            </div>
          </div>
        ))}
      </div>
    </GestaoLayout>
  );
}
