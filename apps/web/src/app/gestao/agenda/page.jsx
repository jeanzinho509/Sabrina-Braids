"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { Plus, Search, Filter } from "lucide-react";
import { useState } from "react";

export default function AgendaPage() {
  const [appointments] = useState([
    {
      id: 1,
      clientName: "Maria Silva",
      phone: "(11) 99999-9999",
      service: "Box Braids Média",
      date: "06/08/2026",
      time: "09:00",
      duration: "4h",
      price: "R$ 280,00",
      deposit: true, // Sinal pago
      status: "confirmed", // 🟢
      notes: "Cabelo sensível, trazer pomada própria."
    },
    {
      id: 2,
      clientName: "Ana Clara",
      phone: "(11) 98888-8888",
      service: "Nagô com Desenho",
      date: "06/08/2026",
      time: "14:00",
      duration: "2h",
      price: "R$ 150,00",
      deposit: false,
      status: "pending", // 🟡
      notes: "Primeira vez no salão."
    },
    {
      id: 3,
      clientName: "Beatriz Santos",
      phone: "(11) 97777-7777",
      service: "Knotless Longa",
      date: "05/08/2026",
      time: "10:00",
      duration: "5h",
      price: "R$ 350,00",
      deposit: true,
      status: "completed", // 🔵
      notes: ""
    },
    {
      id: 4,
      clientName: "Carla Oliveira",
      phone: "(11) 96666-6666",
      service: "Goddess Braids",
      date: "07/08/2026",
      time: "08:00",
      duration: "3h",
      price: "R$ 300,00",
      deposit: false,
      status: "cancelled", // 🔴
      notes: "Cancelou por motivo de saúde."
    }
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case "confirmed":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Confirmado</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Aguardando</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Finalizado</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Agenda</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Gerencie seus agendamentos e horários.</p>
        </div>
        <button className="bg-[#1a1513] text-[#ebd4c5] hover:bg-[#302621] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e8dcc8] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#fcfbf9]">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c6b52]" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#8c6b52] focus:ring-1 focus:ring-[#8c6b52] transition-shadow text-[#1a1513]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8dcc8] rounded-lg text-sm font-medium text-[#5c4737] hover:bg-[#fcfbf9] transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f0e6da]/50 text-[#5c4737] font-medium border-b border-[#e8dcc8]">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Serviço</th>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Valor / Sinal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8dcc8]">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#1a1513]">{apt.clientName}</p>
                    <p className="text-xs text-[#8c6b52] mt-0.5">{apt.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#1a1513] font-medium">{apt.service}</p>
                    <p className="text-xs text-[#8c6b52] mt-0.5">{apt.duration}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#1a1513]">{apt.date}</p>
                    <p className="text-xs text-[#8c6b52] mt-0.5">{apt.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#1a1513] font-medium">{apt.price}</p>
                    {apt.deposit ? (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-[#e8dcc8] text-[#5c4737]">Sinal Pago</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-gray-100 text-gray-500">Sem Sinal</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(apt.status)}
                    {apt.notes && (
                      <p className="text-[11px] text-[#8c6b52] mt-2 max-w-[150px] truncate" title={apt.notes}>
                        Obs: {apt.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#8c6b52] hover:text-[#1a1513] font-medium transition-colors text-sm">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </GestaoLayout>
  );
}
