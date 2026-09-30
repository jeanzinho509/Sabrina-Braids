import { useState } from "react";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import { useApi } from "@/utils/useApi";
import { money, whatsappLink } from "@/utils/salon";
import ProductPhoto from "./ProductPhoto";

export default function ProductsSection() {
  const query = useApi("/api/products");
  const products = query.data?.products || [];
  const [category, setCategory] = useState("");
  const categories = [...new Set(products.map((product) => product.category))];
  const selected = categories.includes(category) ? category : "";
  const visible = selected
    ? products.filter((product) => product.category === selected)
    : products;
  return (
    <section
      id="products"
      aria-labelledby="products-heading"
      className="scroll-mt-6 border-y border-[#eee5d9] bg-[#fcfaf7] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b52]">
              Cuidados além das tranças
            </p>
            <h2
              id="products-heading"
              className="mb-3 text-3xl font-semibold tracking-tight text-gray-900"
            >
              Produtos
            </h2>
            <p className="max-w-xl text-gray-600">
              Finalizadores, cuidados capilares e acessórios para a sua rotina.
            </p>
          </div>
          <a
            href={whatsappLink(
              "Olá! Gostaria de conhecer os produtos da loja.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#5c4737] underline underline-offset-4"
          >
            Fale com a loja{" "}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
        {query.isPending && (
          <p role="status" className="py-8 text-gray-600">
            Carregando produtos...
          </p>
        )}
        {query.isError && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
          >
            <p>Não foi possível carregar os produtos agora.</p>
            <button
              type="button"
              className="mt-3 underline"
              onClick={() => query.refetch()}
            >
              Tentar carregar produtos novamente
            </button>
          </div>
        )}
        {!query.isPending && !query.isError && !products.length && (
          <div className="rounded-2xl border border-[#e8dcc8] bg-white p-8 text-center">
            <ShoppingBag
              aria-hidden="true"
              className="mx-auto mb-4 h-8 w-8 text-[#8c6b52]"
            />
            <p className="font-medium text-gray-900">
              Estamos preparando nosso catálogo de produtos.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Consulte pelo WhatsApp os itens disponíveis na loja.
            </p>
          </div>
        )}
        {!query.isError && products.length > 0 && (
          <>
            {categories.length > 1 && (
              <div
                aria-label="Categorias de produtos"
                className="mb-7 flex flex-wrap gap-2"
              >
                {["", ...categories].map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected === item}
                    onClick={() => setCategory(item)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${selected === item ? "border-[#5c4737] bg-[#5c4737] text-white" : "border-[#dfd2c5] bg-white text-[#725744] hover:border-[#8c6b52]"}`}
                  >
                    {item || "Todos"}
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white"
                >
                  <ProductPhoto product={product} className="aspect-square" />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-2 text-xs font-medium text-[#8c6b52]">
                      {product.category}
                    </p>
                    <h3 className="break-words text-lg font-semibold text-gray-900">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-gray-600">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-auto pt-5">
                      <p className="text-xl font-semibold text-gray-900">
                        {product.price === null
                          ? "Preço sob consulta"
                          : money(product.price)}
                      </p>
                      {!product.available && (
                        <p className="mt-2 text-sm text-[#725744]">
                          Indisponível no momento
                        </p>
                      )}
                      <a
                        href={whatsappLink(
                          product.available
                            ? `Olá! Tenho interesse no produto ${product.name}. Pode me informar a disponibilidade e como comprar?`
                            : `Olá! Gostaria de saber sobre a reposição do produto ${product.name}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${product.available ? "Consultar" : "Consultar reposição de"} ${product.name} no WhatsApp`}
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#5c4737] px-3 py-3 text-center text-sm font-medium text-white transition hover:bg-[#8c6b52]"
                      >
                        {product.available
                          ? "Consultar no WhatsApp"
                          : "Consultar reposição"}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0"
                        />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
