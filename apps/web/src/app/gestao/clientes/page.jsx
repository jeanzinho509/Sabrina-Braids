"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { Plus, Search, User, Instagram, Calendar, History, Phone } from "lucide-react";
import { useState } from "react";

export default function ClientesPage() {
  const [clients] = useState([
    {
      id: 1,
      name: "Yasmin Silva",
      phone: "(11) 99062-3372",
      instagram: "@yasmin.sil",
      birthday: "15/04",
      firstVisit: "10/01/2026",
      lastVisit: "20/04/2026",
      favoriteServices: "Box Braids, Knotless",
      notes: "Gosta das tranças mais soltas na raiz.",
      historyCount: 4
    },
    {
      id: 2,
      name: "Camila Ribeiro",
      phone: "(11) 98888-1234",
      instagram: "@camilarib",
      birthday: "02/11",
      firstVisit: "05/03/2026",
      lastVisit: "05/08/2026",
      favoriteServices: "Goddess Braids",
      notes: "Cliente vip, sempre agendar de manhã.",
      historyCount: 7
    }
  ]);

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Clientes</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Gerencie o relacionamento e histórico.</p>
        </div>
        <button className="bg-[#1a1513] text-[#ebd4c5] hover:bg-[#302621] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e8dcc8] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#fcfbf9]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c6b52]" />
            <input 
              type="text" 
              placeholder="Buscar cliente por nome ou telefone..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#8c6b52] focus:ring-1 focus:ring-[#8c6b52] transition-shadow text-[#1a1513]"
            />
          </div>
        </div>

        {/* Client Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#fcfbf9]">
          {clients.map((client) => (
            <div key={client.id} className="bg-white border border-[#e8dcc8] rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#f0e6da] rounded-full flex items-center justify-center text-[#8c6b52]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1a1513]">{client.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-[#8c6b52]">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>
                      <span className="flex items-center gap-1"><Instagram className="w-3 h-3" /> {client.instagram}</span>
                    </div>
                  </div>
                </div>
                <button className="text-xs font-semibold bg-[#e8dcc8] text-[#5c4737] px-3 py-1.5 rounded-lg hover:bg-[#dcbba1] transition-colors">
                  Ver Perfil
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm">
                <div>
                  <p className="text-[#8c6b52] text-xs">Aniversário</p>
                  <p className="text-[#1a1513] font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {client.birthday}</p>
                </div>
                <div>
                  <p className="text-[#8c6b52] text-xs">Atendimentos</p>
                  <p className="text-[#1a1513] font-medium flex items-center gap-1"><History className="w-3.5 h-3.5" /> {client.historyCount} vezes</p>
                </div>
                <div>
                  <p className="text-[#8c6b52] text-xs">Última Visita</p>
                  <p className="text-[#1a1513] font-medium">{client.lastVisit}</p>
                </div>
                <div>
                  <p className="text-[#8c6b52] text-xs">Serviços Favoritos</p>
                  <p className="text-[#1a1513] font-medium truncate" title={client.favoriteServices}>{client.favoriteServices}</p>
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-[#f0e6da]">
                <p className="text-[#8c6b52] text-xs mb-1">Observações:</p>
                <p className="text-sm text-[#5c4737] italic">{client.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GestaoLayout>
  );
}
