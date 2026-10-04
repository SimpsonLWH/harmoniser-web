import { JsonLd } from "@/components/JsonLd";
import { FAQ_ITEMS } from "@/lib/seo/faq";
import { faqPageGraph } from "@/lib/seo/jsonld";

/*
 * Answer-engine copy, rendered from the same array the FAQPage schema uses.
 * A definition list rather than an accordion: no JavaScript, no duplicate
 * card grid, and every answer is in the HTML for crawlers and screen readers.
 */
export function Faq() {
  return (
    <div>
      <JsonLd data={faqPageGraph(FAQ_ITEMS)} />
      <dl className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <dt className="text-[17px] font-bold tracking-tight text-text">{item.question}</dt>
            <dd className="mt-2 max-w-[52ch] text-[15px] leading-7 text-text-2">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
