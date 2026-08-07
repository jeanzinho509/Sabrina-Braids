"use client";

import { GestaoLayout } from "./components/GestaoLayout";
import { 
  Users, 
  CircleDollarSign, 
  CheckSquare, 
  Package, 
  CalendarClock, 
  TrendingUp 
} from "lucide-react";

export default function Dashboard() {
  // Mock data
  const metrics = [
    { label: "Clientes de Hoje", value: "8", icon: Users, color: "text-[#8c6b52]", bg: "bg-[#8c6b52]/10" },
    { label: "Faturamento Hoje", value: "R$ 640,00", icon: CircleDollarSign, color: "text-[#2e7d32]", bg: "bg-[#2e7d32]/10" },
  ];

  const tasks = [
    { id: 1, text: "Confirmar clientes de amanhã", done: false },
    { id: 2, text: "Fazer postagem no Instagram", done: true },
    { id: 3, text: "Comprar Jumbo", done: false },
  ];

  const lowStock = [
    { id: 1, name: "Gelatina", current: 2, min: 3 },
    { id: 2, name: "Mousse", current: 1, min: 2 },
  ];

  const bills = [
    { id: 1, name: "Internet", date: "10/08", amount: "R$ 99,90" },
    { id: 2, name: "Fornecedor", date: "12/08", amount: "R$ 450,00" },
  ];

  const goal = { target: 8000, current: 5040, percent: 63 };

  return (
    <GestaoLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Bom dia, Sabrina! 🌸</h2>
        <p className="text-[#8c6b52] mt-1 text-lg">Aqui está o resumo do seu salão hoje.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dcc8] flex items-center gap-4">
            <div className={`p-4 rounded-xl ${m.bg}`}>
              <m.icon className={`w-8 h-8 ${m.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5c4737]">{m.label}</p>
              <h3 className="text-2xl font-bold text-[#1a1513] mt-1">{m.value}</h3>
            </div>
          </div>
        ))}

        {/* Goal Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dcc8] flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#8c6b52]" />
              <p className="text-sm font-medium text-[#5c4737]">Meta do Mês (R$ 8.000)</p>
            </div>
            <span className="text-sm font-bold text-[#1a1513]">{goal.percent}%</span>
          </div>
          <div className="w-full bg-[#f0e6da] rounded-full h-3">
            <div className="bg-[#8c6b52] h-3 rounded-full" style={{ width: `${goal.percent}%` }}></div>
          </div>
          <p className="text-xs text-[#8c6b52] mt-2 text-right">R$ {goal.current} alcançados</p>
        </div>
      </div>

      {/* 3 Columns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tarefas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dcc8]">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-[#8c6b52]" />
            <h3 className="text-lg font-semibold text-[#1a1513]">Tarefas Prioritárias</h3>
          </div>
          <ul className="space-y-3">
            {tasks.map(t => (
              <li key={t.id} className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={t.done} 
                  readOnly
                  className="mt-1 w-4 h-4 text-[#8c6b52] rounded border-[#dcbba1] focus:ring-[#8c6b52]" 
                />
                <span className={`text-sm ${t.done ? "text-[#a08f86] line-through" : "text-[#1a1513]"}`}>
                  {t.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Estoque */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dcc8]">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-[#1a1513]">Estoque Baixo</h3>
          </div>
          <ul className="space-y-4">
            {lowStock.map(s => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1a1513]">{s.name}</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                  {s.current} / {s.min}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contas */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e8dcc8]">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-[#1a1513]">Contas a Vencer</h3>
          </div>
          <ul className="space-y-4">
            {bills.map(b => (
              <li key={b.id} className="flex items-center justify-between border-b border-[#f0e6da] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-[#1a1513]">{b.name}</p>
                  <p className="text-xs text-[#8c6b52]">Vence: {b.date}</p>
                </div>
                <span className="text-sm font-bold text-[#1a1513]">{b.amount}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </GestaoLayout>
  );
}
