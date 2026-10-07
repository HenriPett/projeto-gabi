import { Breadcrumb } from "@/components/Breadcrumb";

// /metodologia — de onde vêm classificação, protocolos, composição e preços.
export const metadata = { title: "Metodologia e fontes" };

export default function Pagina() {
  return (
    <div className="pagina">
      <Breadcrumb itens={[{ rotulo: "Sistemas Adesivos", href: "/" }, { rotulo: "Metodologia e fontes" }]} />
      <article className="prose stack pb-6">
        <h1>Metodologia e fontes</h1>
        <p>
          Cada informação técnica exibida — classificação, composição, indicações e modo de uso — aponta para a fonte
          consultada (instruções de uso, ficha técnica ou site do fabricante), com a data de acesso.
        </p>
        <p>
          Quando fontes discordam, mostramos todas as versões lado a lado, sem escolher uma. Quando um dado não foi
          encontrado em fonte confiável, ele aparece como “Informação ainda não verificada” — o que não significa que o produto não tenha aquela característica. “Não” só aparece quando a fonte afirma a ausência.
        </p>
        <h2 id="precos">Como comparamos preços</h2>
        <p>
          Só comparamos preços da <strong>mesma apresentação</strong> (mesmo fabricante, produto, volume e quantidade).
          Usamos o preço vigente da página, sem condição de pagamento. Lojas com apresentações diferentes aparecem
          separadas, sem ranking.
        </p>
        <p>
          Cada preço mostra a data em que foi consultado. Preços podem ter mudado desde então — confirme sempre no site
          da loja.
        </p>
      </article>
    </div>
  );
}
