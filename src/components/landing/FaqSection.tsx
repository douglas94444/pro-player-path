import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CAMPANHA } from "@/data/campanha-copy";
import { trackMetaCustom } from "@/lib/meta-pixel";

const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CAMPANHA.faq.map((f) => ({
    "@type": "Question",
    name: f.pergunta,
    acceptedAnswer: { "@type": "Answer", text: f.resposta },
  })),
});

export function FaqSection() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      <Accordion
        type="single"
        collapsible
        className="mt-8 w-full max-w-3xl"
        onValueChange={(v) => {
          if (v) trackMetaCustom("FaqOpen", { pergunta: v });
        }}
      >
        {CAMPANHA.faq.map((f) => (
          <AccordionItem key={f.pergunta} value={f.pergunta}>
            <AccordionTrigger className="text-left text-sm font-bold sm:text-base">
              {f.pergunta}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.resposta}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
