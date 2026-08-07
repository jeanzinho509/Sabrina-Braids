"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { CheckSquare, Target, Plus, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export default function TarefasMetasPage() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Confirmar clientes de amanhã", done: false },
    { id: 2, text: "Comprar jumbo", done: false },
    { id: 3, text: "Fazer postagem", done: true },
    { id: 4, text: "Pagar aluguel", done: false },
    { id: 5, text: "Fechar caixa", done: false },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const revenueGoal = { current: 5040, target: 8000, percentage: 63 };
  const clientsGoal = { current: 32, target: 45, percentage: Math.round((32/45)*100) };

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Tarefas & Metas</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Acompanhe seu progresso e deveres do dia.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metas Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#8c6b52]/10 rounded-xl">
                <Target className="w-6 h-6 text-[#8c6b52]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1513]">Metas do Mês</h3>
            </div>
            
            <div className="space-y-8">
              {/* Revenue Goal */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#8c6b52]" />
                    <span className="font-medium text-[#1a1513]">Meta de Faturamento</span>
                  </div>
                  <span className="font-bold text-[#1a1513]">{revenueGoal.percentage}%</span>
                </div>
                <div className="w-full bg-[#f0e6da] rounded-full h-4 mb-2">
                  <div className="bg-[#8c6b52] h-4 rounded-full transition-all duration-500" style={{ width: `${revenueGoal.percentage}%` }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5c4737] font-medium">R$ {revenueGoal.current.toFixed(2)}</span>
                  <span className="text-[#8c6b52]">Meta: R$ {revenueGoal.target.toFixed(2)}</span>
                </div>
              </div>

              {/* Clients Goal */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#8c6b52]" />
                    <span className="font-medium text-[#1a1513]">Clientes Atendidas</span>
                  </div>
                  <span className="font-bold text-[#1a1513]">{clientsGoal.percentage}%</span>
                </div>
                <div className="w-full bg-[#f0e6da] rounded-full h-4 mb-2">
                  <div className="bg-[#8c6b52] h-4 rounded-full transition-all duration-500" style={{ width: `${clientsGoal.percentage}%` }}></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5c4737] font-medium">{clientsGoal.current} clientes</span>
                  <span className="text-[#8c6b52]">Meta: {clientsGoal.target} clientes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarefas Column */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#e8dcc8]/50 rounded-xl">
                  <CheckSquare className="w-6 h-6 text-[#5c4737]" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1513]">Lista de Tarefas</h3>
              </div>
              <button className="text-[#8c6b52] hover:bg-[#fcfbf9] p-2 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              <ul className="space-y-3">
                {tasks.map(t => (
                  <li 
                    key={t.id} 
                    onClick={() => toggleTask(t.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      t.done 
                      ? "bg-[#fcfbf9] border-[#f0e6da]" 
                      : "bg-white border-[#e8dcc8] hover:border-[#8c6b52]"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      t.done 
                      ? "bg-[#8c6b52] border-[#8c6b52]" 
                      : "border-[#c8a58a]"
                    }`}>
                      {t.done && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-base transition-colors ${t.done ? "text-[#a08f86] line-through" : "text-[#1a1513] font-medium"}`}>
                      {t.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#f0e6da]">
              <input 
                type="text" 
                placeholder="Adicionar nova tarefa..." 
                className="w-full px-4 py-3 bg-[#fcfbf9] border border-[#e8dcc8] rounded-xl text-sm focus:outline-none focus:border-[#8c6b52] focus:ring-1 focus:ring-[#8c6b52] transition-shadow text-[#1a1513]"
              />
            </div>
          </div>
        </div>
      </div>
    </GestaoLayout>
  );
}
