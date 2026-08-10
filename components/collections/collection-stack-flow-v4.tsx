import Link from "next/link";
import { ArrowRight, CornerDownRight, GitBranch, GitMerge } from "lucide-react";

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
      data-cx-accent="indigo"
      className="cx-stack-flow-v4"
      aria-labelledby="cx-stack-flow-title"
    >
      <header className="cx-stack-flow-v4__head">
        <span className="cx-stack-flow-v4__eyebrow">
          <GitBranch className="size-3.5" aria-hidden="true" />
          Lo stack, in ordine
        </span>
        <h2 id="cx-stack-flow-title" className="cx-stack-flow-v4__title">
          Come funziona, in pratica
        </h2>
        {collection.rationale && (
          <p className="cx-stack-flow-v4__lede">{collection.rationale}</p>
        )}
      </header>

      <ol className="cx-stack-flow-v4__list" aria-label="Stack CORE in ordine">
        {cores.map((slot, index) => {
          const toolHref = `/toools/${slot.tool.slug}`;
          const isManual = slot.manual_handoff === true;
          const hasHandoff = Boolean(slot.next_handoff);

          return (
            <li key={slot.tool.slug} className="cx-stack-flow-v4__item">
              <div className="cx-stack-flow-v4__node" aria-hidden="true">
                <span className="cx-stack-flow-v4__num">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <article className="cx-stack-flow-v4__stage">
                <div className="cx-stack-flow-v4__stage-head">
                  {slot.stage && (
                    <span className="cx-stack-flow-v4__stage-label">
                      {slot.stage}
                    </span>
                  )}
                  <Link
                    href={toolHref}
                    className="cx-stack-flow-v4__tool"
                    aria-label={`Vai alla scheda di ${slot.tool.name}`}
                  >
                    {slot.tool.name}
                  </Link>
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
                      <h3 className="cx-stack-flow-v4__role">{slot.role}</h3>
                    )}
                    {slot.why_chosen && (
                      <p className="cx-stack-flow-v4__why">{slot.why_chosen}</p>
                    )}

                    {(slot.input || slot.output) && (
                      <div className="cx-stack-flow-v4__flow">
                        {slot.input && (
                          <div className="cx-stack-flow-v4__flow-cell">
                            <span className="cx-stack-flow-v4__flow-key">
                              ↓ Entra
                            </span>
                            <span className="cx-stack-flow-v4__flow-val">
                              {slot.input}
                            </span>
                          </div>
                        )}
                        {slot.output && (
                          <div className="cx-stack-flow-v4__flow-cell">
                            <span className="cx-stack-flow-v4__flow-key">
                              ↑ Esce
                            </span>
                            <span className="cx-stack-flow-v4__flow-val">
                              {slot.output}
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
                          {isManual ? "Passaggio manuale" : "Passaggio"}:{" "}
                          {slot.next_handoff}
                        </span>
                      </p>
                    )}

                    {(slot.limitations ||
                      slot.when_to_skip ||
                      slot.replacement_trigger ||
                      slot.relevant_guide_slug) && (
                      <details className="cx-stack-flow-v4__details">
                        <summary className="cx-stack-flow-v4__details-summary">
                          <span>Più dettagli su {slot.tool.name}</span>
                          <ArrowRight
                            className="size-3 cx-stack-flow-v4__details-arrow"
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="cx-stack-flow-v4__details-body">
                          {slot.limitations && (
                            <div>
                              <span className="cx-stack-flow-v4__details-label">
                                Limiti
                              </span>
                              <p>{slot.limitations}</p>
                            </div>
                          )}
                          {slot.when_to_skip && (
                            <div>
                              <span className="cx-stack-flow-v4__details-label">
                                Quando saltarlo
                              </span>
                              <p>{slot.when_to_skip}</p>
                            </div>
                          )}
                          {slot.replacement_trigger && (
                            <div>
                              <span className="cx-stack-flow-v4__details-label">
                                Quando cambiarlo
                              </span>
                              <p>{slot.replacement_trigger}</p>
                            </div>
                          )}
                          {slot.relevant_guide_slug && (
                            <Link
                              href={`/posts/${slot.relevant_guide_slug}`}
                              className="cx-stack-flow-v4__guide-link"
                            >
                              Approfondisci {slot.tool.name}
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
      </ol>

      {optionals.length > 0 && (
        <div className="cx-stack-flow-v4__optional">
          <h3 className="cx-stack-flow-v4__sub-label">Aggiungi solo se serve</h3>
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
                      {slot.stage}
                    </span>
                  )}
                </div>
                {slot.note && (
                  <p className="cx-stack-flow-v4__optional-note">
                    {slot.note}
                  </p>
                )}
                {slot.when_to_skip && (
                  <p className="cx-stack-flow-v4__optional-skip">
                    <strong>Quando saltarlo:</strong> {slot.when_to_skip}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="cx-stack-flow-v4__alternative">
          <h3 className="cx-stack-flow-v4__sub-label">
            Sostituisce, non aggiunge
          </h3>
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
                          {slot.stage}
                        </span>
                      )}
                    </div>
                    {slot.note && (
                      <p className="cx-stack-flow-v4__alternative-note">
                        {slot.note}
                      </p>
                    )}
                    {replacesNames.length > 0 && (
                      <p className="cx-stack-flow-v4__alternative-replaces">
                        <strong>Sostituisce</strong> {replacesNames.join(", ")}
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
