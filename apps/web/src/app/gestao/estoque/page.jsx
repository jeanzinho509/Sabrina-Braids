"use client";

import { GestaoLayout } from "../components/GestaoLayout";
import { Plus, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function EstoquePage() {
  const [estoque] = useState([
    { id: 1, produto: "Gel", quantidade: 6, minimo: 3 },
    { id: 2, produto: "Gelatina", quantidade: 2, minimo: 3 },
    { id: 3, produto: "Mousse", quantidade: 5, minimo: 2 },
    { id: 4, produto: "Jumbo", quantidade: 10, minimo: 5 },
  ]);

  return (
    <GestaoLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-[#1a1513] tracking-tight">Estoque</h2>
          <p className="text-[#8c6b52] mt-1 text-sm">Controle de produtos e materiais.</p>
        </div>
        <button className="bg-[#1a1513] text-[#ebd4c5] hover:bg-[#302621] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e8dcc8] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#fcfbf9]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c6b52]" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#8c6b52] focus:ring-1 focus:ring-[#8c6b52] transition-shadow text-[#1a1513]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f0e6da]/50 text-[#5c4737] font-medium border-b border-[#e8dcc8]">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Quantidade Atual</th>
                <th className="px-6 py-4 text-center">Estoque Mínimo</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Comprar?</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8dcc8]">
              {estoque.map((item) => {
                const needsRestock = item.quantidade < item.minimo;
                return (
                  <tr key={item.id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#1a1513]">{item.produto}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-[#1a1513] font-medium">
                      {item.quantidade}
                    </td>
                    <td className="px-6 py-4 text-center text-[#8c6b52]">
                      {item.minimo}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {needsRestock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          <AlertTriangle className="w-3.5 h-3.5" /> Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-lg">
                      {needsRestock ? "✅" : "❌"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="text-[#8c6b52] hover:text-[#1a1513] font-medium transition-colors text-sm">Editar</button>
                        <button className="text-[#8c6b52] hover:text-[#1a1513] font-medium transition-colors text-sm">Atualizar Qtd</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </GestaoLayout>
  );
}
