import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Link from "@/components/ui/app-link";
import { ArrowRight, CornerDownRight, GitMerge } from "lucide-react";

import type { CuratedCollection } from "@/lib/types/collection";
import { getCollectionCoreSlots } from "@/lib/collections/helpers";

import { CollectionToolGlyph } from "./collection-tool-glyph";

type CollectionStackFlowV4Props = {
  collection: CuratedCollection;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Stack Flow V4 — one connected vertical composition, not isolated
 * cards. OPT/ALT integrated as inline inserts / branches.
 *
 * Per stage (CORE):
 *   number + tool glyph + name + role + why (compact)
 *   input → output (inline)
 *   manual handoff as inline editorial note (not badge)
 *   progressive disclosure for "limits / when to skip / replacement"
 *
 * OPTIONAL: inline insert with hairline + small note.
 * ALTERNATIVE: replacement branch — small group at the bottom.
 *
 * Inherits V4.1 DNA: real brand gradients via CollectionToolGlyph,
 * restrained accent, no box-in-box.
 */
export function CollectionStackFlowV4({ collection }: CollectionStackFlowV4Props) {
  const cores = getCollectionCoreSlots(collection);
  const optionals = collection.included_tools.filter((s) => s.is_optional);
  const alternatives = collection.included_tools.filter((s) => s.is_alternative);

  return (
    <section
      id="cx-detail-stack"
      className="cx-stack-flow-v4 motion-reveal"
      aria-labelledby="cx-stack-flow-title"
    >
      <header className="cx-stack-flow-v4__head">
        <h2 id="cx-stack-flow-title" className="sr-only"><LocalizedText>{"Lo stack, in ordine "}</LocalizedText></h2>
      </header>

      <LocalizedAttributes><ol className="cx-stack-flow-v4__list" aria-label="Stack CORE in ordine">
        {cores.map((slot, index) => {
          const toolHref = `/toools/${slot.tool.slug}`;
          const isManual = slot.manual_handoff === true;
          const hasHandoff = Boolean(slot.next_handoff);

          return (
            <li
              key={slot.tool.slug}
              className="cx-stack-flow-v4__item"
              data-collection-step={index + 1}
            >
              <div className="cx-stack-flow-v4__node" aria-hidden="true">
                <span className="cx-stack-flow-v4__num">
                  <LocalizedText>{String(index + 1).padStart(2, "0")}</LocalizedText>
                </span>
              </div>

              <article className="cx-stack-flow-v4__stage">
                <LocalizedAttributes><Link
                  href={toolHref}
                  className="cx-stack-flow-v4__row-link"
                  aria-label={`Vai alla scheda di ${slot.tool.name}`}
                >
                  <CollectionToolGlyph
                    slug={slot.tool.slug}
                    name={slot.tool.name}
                    size="md"
                    accentFrom={slot.tool.accentFrom}
                    accentTo={slot.tool.accentTo}
                    domain={slot.tool.domain}
                    externalUrl={slot.tool.externalUrl}
                  />
                  <span className="cx-stack-flow-v4__row-text">
                    {slot.stage && (
                      <span className="cx-stack-flow-v4__stage-label">
                        <LocalizedText>{slot.stage}</LocalizedText>
                      </span>
                    )}
                    <span className="cx-stack-flow-v4__tool">
                      {slot.tool.name}
                    </span>
                  </span>
                  <ArrowRight className="size-4 cx-stack-flow-v4__row-chevron" aria-hidden="true" />
                </Link></LocalizedAttributes>
                <div className="cx-stack-flow-v4__stage-head">
                  {slot.stage && (
                    <span className="cx-stack-flow-v4__stage-label cx-stack-flow-v4__stage-label--full">
                      <LocalizedText>{slot.stage}</LocalizedText>
                    </span>
                  )}
                  <LocalizedAttributes><Link
                    href={toolHref}
                    className="cx-stack-flow-v4__tool cx-stack-flow-v4__tool--full"
                    aria-label={`Vai alla scheda di ${slot.tool.name}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {slot.tool.name}
                  </Link></LocalizedAttributes>
                </div>

                <div className="cx-stack-flow-v4__row">
                  <CollectionToolGlyph
                    slug={slot.tool.slug}
                    name={slot.tool.name}
                    size="md"
                    accentFrom={slot.tool.accentFrom}
                    accentTo={slot.tool.accentTo}
                    domain={slot.tool.domain}
                    externalUrl={slot.tool.externalUrl}
                  />
                  <div className="cx-stack-flow-v4__body">
                    {slot.role && (
                      <h3 className="cx-stack-flow-v4__role"><LocalizedText>{slot.role}</LocalizedText></h3>
                    )}
                    {slot.why_chosen && (
                      <p className="cx-stack-flow-v4__why"><LocalizedText>{slot.why_chosen}</LocalizedText></p>
                    )}

                    {(slot.input || slot.output) && (
                      <div className="cx-stack-flow-v4__flow">
                        {slot.input && (
                          <div className="cx-stack-flow-v4__flow-cell">
                            <span className="cx-stack-flow-v4__flow-key"><LocalizedText>{"↓ Entra "}</LocalizedText></span>
                            <span className="cx-stack-flow-v4__flow-val">
                              {slot.input}
                            </span>
                          </div>
                        )}
                        {slot.output && (
                          <div className="cx-stack-flow-v4__flow-cell">
                            <span className="cx-stack-flow-v4__flow-key"><LocalizedText>{"↑ Esce "}</LocalizedText></span>
                            <span className="cx-stack-flow-v4__flow-val">
                              <LocalizedText>{slot.output}</LocalizedText>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {hasHandoff && (
                      <p
                        className={cx(
                          "cx-stack-flow-v4__handoff",
                          isManual && "cx-stack-flow-v4__handoff--manual",
                        )}
                      >
                        {isManual ? (
                          <GitMerge
                            className="size-3"
                            aria-hidden="true"
                          />
                        ) : (
                          <CornerDownRight
                            className="size-3"
                            aria-hidden="true"
                          />
                        )}
                        <span>
                          <LocalizedText>{isManual ? "Passaggio manuale" : "Passaggio"}</LocalizedText>:<LocalizedText>{" "}</LocalizedText>
                          <LocalizedText>{slot.next_handoff}</LocalizedText>
                        </span>
                      </p>
                    )}

                    {(slot.limitations ||
                      slot.when_to_skip ||
                      slot.replacement_trigger ||
                      slot.relevant_guide_slug) && (
                      <details className="cx-stack-flow-v4__details">
                        <summary className="cx-stack-flow-v4__details-summary">
                          <span><LocalizedText>{"Più dettagli su "}</LocalizedText>{slot.tool.name}</span>
                          <ArrowRight
                            className="size-3 cx-stack-flow-v4__details-arrow"
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="cx-stack-flow-v4__details-body">
                          {slot.limitations && (
                            <div>
                              <span className="cx-stack-flow-v4__details-label"><LocalizedText>{"Limiti "}</LocalizedText></span>
                              <p><LocalizedText>{slot.limitations}</LocalizedText></p>
                            </div>
                          )}
                          {slot.when_to_skip && (
                            <div>
                              <span className="cx-stack-flow-v4__details-label"><LocalizedText>{"Quando saltarlo "}</LocalizedText></span>
                              <p><LocalizedText>{slot.when_to_skip}</LocalizedText></p>
                            </div>
                          )}
                          {slot.replacement_trigger && (
                            <div>
                              <span className="cx-stack-flow-v4__details-label"><LocalizedText>{"Quando cambiarlo "}</LocalizedText></span>
                              <p><LocalizedText>{slot.replacement_trigger}</LocalizedText></p>
                            </div>
                          )}
                          {slot.relevant_guide_slug && (
                            <Link
                              href={`/posts/${slot.relevant_guide_slug}`}
                              className="cx-stack-flow-v4__guide-link"
                            ><LocalizedText>{"Approfondisci "}</LocalizedText>{slot.tool.name}
                              <ArrowRight
                                className="size-3"
                                aria-hidden="true"
                              />
                            </Link>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol></LocalizedAttributes>
      {collection.rationale ? (
          <details className="cx-stack-flow-v4__why">
            <summary><LocalizedText>{"Perché questa raccolta"}</LocalizedText></summary>
            <p className="cx-stack-flow-v4__lede"><LocalizedText>{collection.rationale}</LocalizedText></p>
          </details>
        ) : null}

      {optionals.length > 0 && (
        <div className="cx-stack-flow-v4__optional">
          <h3 className="cx-stack-flow-v4__sub-label"><LocalizedText>{"Aggiungi solo se serve"}</LocalizedText></h3>
          <ul className="cx-stack-flow-v4__optional-list">
            {optionals.map((slot) => (
              <li
                key={slot.tool.slug}
                className="cx-stack-flow-v4__optional-item"
              >
                <CollectionToolGlyph
                  slug={slot.tool.slug}
                  name={slot.tool.name}
                  size="sm"
                  accentFrom={slot.tool.accentFrom}
                  accentTo={slot.tool.accentTo}
                  domain={slot.tool.domain}
                  externalUrl={slot.tool.externalUrl}
                />
                <div>
                  <Link
                    href={`/toools/${slot.tool.slug}`}
                    className="cx-stack-flow-v4__optional-name"
                  >
                    {slot.tool.name}
                  </Link>
                  {slot.stage && (
                    <span className="cx-stack-flow-v4__optional-stage">
                      <LocalizedText>{slot.stage}</LocalizedText>
                    </span>
                  )}
                </div>
                {slot.note && (
                  <p className="cx-stack-flow-v4__optional-note">
                    <LocalizedText>{slot.note}</LocalizedText>
                  </p>
                )}
                {slot.when_to_skip && (
                  <p className="cx-stack-flow-v4__optional-skip">
                    <strong><LocalizedText>{"Quando saltarlo:"}</LocalizedText></strong> <LocalizedText>{slot.when_to_skip}</LocalizedText>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="cx-stack-flow-v4__alternative">
          <h3 className="cx-stack-flow-v4__sub-label"><LocalizedText>{"Sostituisce, non aggiunge "}</LocalizedText></h3>
          <ul className="cx-stack-flow-v4__alternative-list">
            {alternatives.map((slot) => {
              const replaces = slot.alternatives ?? [];
              const replacesNames = replaces
                .map((slug) => {
                  const found = collection.included_tools.find(
                    (s) => s.tool.slug === slug,
                  );
                  return found?.tool.name ?? slug;
                })
                .filter(Boolean);

              return (
                <li
                  key={slot.tool.slug}
                  className="cx-stack-flow-v4__alternative-item"
                >
                  <CollectionToolGlyph
                    slug={slot.tool.slug}
                    name={slot.tool.name}
                    size="sm"
                    accentFrom={slot.tool.accentFrom}
                    accentTo={slot.tool.accentTo}
                    domain={slot.tool.domain}
                    externalUrl={slot.tool.externalUrl}
                  />
                  <div className="cx-stack-flow-v4__alternative-body">
                    <div className="cx-stack-flow-v4__alternative-head">
                      <Link
                        href={`/toools/${slot.tool.slug}`}
                        className="cx-stack-flow-v4__alternative-name"
                      >
                        {slot.tool.name}
                      </Link>
                      {slot.stage && (
                        <span className="cx-stack-flow-v4__alternative-stage">
                          <LocalizedText>{slot.stage}</LocalizedText>
                        </span>
                      )}
                    </div>
                    {slot.note && (
                      <p className="cx-stack-flow-v4__alternative-note">
                        <LocalizedText>{slot.note}</LocalizedText>
                      </p>
                    )}
                    {replacesNames.length > 0 && (
                      <p className="cx-stack-flow-v4__alternative-replaces">
                        <strong><LocalizedText>{"Sostituisce"}</LocalizedText></strong> <LocalizedText>{replacesNames.join(", ")}</LocalizedText>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
