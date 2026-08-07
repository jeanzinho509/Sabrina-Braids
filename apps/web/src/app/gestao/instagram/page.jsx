"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { Plus, Video, Image as ImageIcon, Tag, Users } from "lucide-react";
import { useState } from "react";

export default function InstagramPage() {
  const [ideas] = useState([
    {
      category: "Reels",
      icon: Video,
      items: [
        "Transição Antes e Depois (Box Braids)",
        "Dica de como cuidar das tranças na hora de dormir",
        "Bastidores do salão - Um dia de trabalho"
      ]
    },
    {
      category: "Fotos / Feed",
      icon: ImageIcon,
      items: [
        "Foto detalhe raiz Knotless",
        "Carrossel: Tipos de tranças e duração",
        "Foto da fachada do salão"
      ]
    },
    {
      category: "Promoções",
      icon: Tag,
      items: [
        "Sorteio Mês das Mães",
        "Desconto 10% para amigas que agendarem juntas"
      ]
    },
    {
      category: "Parcerias",
      icon: Users,
      items: [
        "Mandar direct para a influencer @fulana",
        "Procurar fornecedor de jumbo para collab"
      ]
    }
  ]);

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Conteúdo para Instagram</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Organize suas ideias de posts, reels e parcerias.</p>
        </div>
        <button className="bg-[#1a1513] text-[#ebd4c5] hover:bg-[#302621] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Ideia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ideas.map((section) => (
          <div key={section.category} className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-[#e8dcc8] bg-[#fcfbf9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <section.icon className="w-5 h-5 text-[#8c6b52]" />
                <h3 className="font-bold text-[#1a1513]">{section.category}</h3>
              </div>
              <span className="bg-[#e8dcc8] text-[#5c4737] text-xs font-bold px-2 py-0.5 rounded-full">
                {section.items.length}
              </span>
            </div>
            
            <div className="p-4 flex-1 bg-white">
              <ul className="space-y-3">
                {section.items.map((item, index) => (
                  <li key={index} className="p-3 bg-[#fcfbf9] border border-[#e8dcc8] rounded-xl text-sm text-[#5c4737] hover:border-[#8c6b52] hover:shadow-sm transition-all cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 border-t border-[#f0e6da]">
              <button className="w-full py-2 text-sm font-medium text-[#8c6b52] hover:bg-[#fcfbf9] rounded-lg transition-colors flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </GestaoLayout>
  );
}
