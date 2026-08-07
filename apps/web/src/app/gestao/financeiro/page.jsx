"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { Plus, ArrowUpCircle, ArrowDownCircle, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("entradas");

  const entradas = [
    { id: 1, date: "06/08/2026", client: "Maria Silva", service: "Box Braids Média", method: "Pix", amount: 280.00 },
    { id: 2, date: "05/08/2026", client: "Beatriz Santos", service: "Knotless Longa", method: "Cartão de Crédito", amount: 350.00 },
  ];

  const saidas = [
    { id: 1, date: "05/08/2026", category: "Material", description: "Jumbo e Gelatina", amount: 150.00 },
    { id: 2, date: "01/08/2026", category: "Aluguel", description: "Aluguel do espaço", amount: 800.00 },
  ];

  const metrics = [
    { label: "Receita do Dia", value: "R$ 640,00", icon: DollarSign, color: "text-[#2e7d32]", bg: "bg-[#2e7d32]/10" },
    { label: "Receita do Mês", value: "R$ 5.040,00", icon: ArrowUpCircle, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Despesas do Mês", value: "R$ 1.250,00", icon: ArrowDownCircle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Lucro Estimado", value: "R$ 3.790,00", icon: Wallet, color: "text-[#8c6b52]", bg: "bg-[#8c6b52]/10" },
  ];

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Financeiro</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Controle de caixa, receitas e despesas.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
          <button className="bg-[#1a1513] text-[#ebd4c5] hover:bg-[#302621] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Entrada
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dcc8] flex items-center gap-4">
            <div className={`p-4 rounded-xl ${m.bg}`}>
              <m.icon className={`w-6 h-6 ${m.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5c4737]">{m.label}</p>
              <h3 className="text-xl font-bold text-[#1a1513] mt-1">{m.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#e8dcc8]">
          <button 
            onClick={() => setActiveTab("entradas")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "entradas" ? "border-b-2 border-[#1a1513] text-[#1a1513]" : "text-[#8c6b52] hover:bg-[#fcfbf9]"}`}
          >
            Entradas (Receitas)
          </button>
          <button 
            onClick={() => setActiveTab("saidas")}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "saidas" ? "border-b-2 border-[#1a1513] text-[#1a1513]" : "text-[#8c6b52] hover:bg-[#fcfbf9]"}`}
          >
            Saídas (Despesas)
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {activeTab === "entradas" ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#f0e6da]/50 text-[#5c4737] font-medium border-b border-[#e8dcc8]">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Serviço</th>
                  <th className="px-6 py-4">Pagamento</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8dcc8]">
                {entradas.map((e) => (
                  <tr key={e.id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="px-6 py-4 text-[#1a1513]">{e.date}</td>
                    <td className="px-6 py-4 font-medium text-[#1a1513]">{e.client}</td>
                    <td className="px-6 py-4 text-[#5c4737]">{e.service}</td>
                    <td className="px-6 py-4 text-[#5c4737]">{e.method}</td>
                    <td className="px-6 py-4 font-bold text-green-700 text-right">R$ {e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#f0e6da]/50 text-[#5c4737] font-medium border-b border-[#e8dcc8]">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8dcc8]">
                {saidas.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="px-6 py-4 text-[#1a1513]">{s.date}</td>
                    <td className="px-6 py-4 text-[#1a1513]">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-semibold">{s.category}</span>
                    </td>
                    <td className="px-6 py-4 text-[#5c4737]">{s.description}</td>
                    <td className="px-6 py-4 font-bold text-red-700 text-right">- R$ {s.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </GestaoLayout>
  );
}
