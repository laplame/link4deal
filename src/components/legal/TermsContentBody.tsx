import React from 'react';
import {
    LAST_UPDATED,
    SUPPORT_EMAIL,
    TERMS_SECTIONS,
    type TermsBlock,
} from '../../data/termsContent';

function TermsBlocks({ blocks, compact }: { blocks: TermsBlock[]; compact?: boolean }) {
    const textClass = compact ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed';

    return (
        <div className={`space-y-3 ${compact ? 'text-gray-300' : 'text-gray-300'}`}>
            {blocks.map((block, i) => {
                if (block.type === 'p') {
                    return (
                        <p key={i} className={textClass}>
                            {block.text}
                        </p>
                    );
                }
                if (block.type === 'def') {
                    return (
                        <p key={i} className={textClass}>
                            <strong className="text-white">{block.term}</strong> {block.text}
                        </p>
                    );
                }
                return (
                    <ul key={i} className="space-y-1.5 pl-1">
                        {block.items.map((it, j) => (
                            <li key={j} className={`flex items-start gap-2 ${textClass}`}>
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-400/70 shrink-0" />
                                <span>{it}</span>
                            </li>
                        ))}
                    </ul>
                );
            })}
        </div>
    );
}

interface TermsContentBodyProps {
    compact?: boolean;
    showContact?: boolean;
    showHeader?: boolean;
}

export default function TermsContentBody({
    compact = false,
    showContact = true,
    showHeader = true,
}: TermsContentBodyProps) {
    const sectionPad = compact ? 'p-3 sm:p-4' : 'p-5 sm:p-6';
    const titleClass = compact ? 'text-base font-semibold' : 'text-lg font-semibold';

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {showHeader && (
                <div className={compact ? 'text-center pb-2' : 'text-center mb-2'}>
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-fuchsia-200 font-medium`}>
                        DameCodigo • Link4Deal • BizneAI
                    </p>
                    <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>
                        Última actualización: {LAST_UPDATED}
                    </p>
                </div>
            )}

            {TERMS_SECTIONS.map((section) => (
                <section
                    key={section.n}
                    className={`rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm ${sectionPad}`}
                >
                    <h2 className={`${titleClass} text-white mb-3 flex items-start gap-2`}>
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-bold shrink-0 ring-1 ring-fuchsia-500/30">
                            {section.n}
                        </span>
                        {section.title}
                    </h2>
                    <TermsBlocks blocks={section.blocks} compact={compact} />
                </section>
            ))}

            {showContact && (
                <section
                    className={`rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-sm ${sectionPad}`}
                >
                    <h2 className={`${titleClass} text-white mb-3 flex items-start gap-2`}>
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-bold shrink-0 ring-1 ring-fuchsia-500/30">
                            19
                        </span>
                        Contacto
                    </h2>
                    <div className="space-y-3 text-gray-300">
                        <p className={compact ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed'}>
                            Para cualquier duda relacionada con estos términos:
                        </p>
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className={`inline-block font-mono text-fuchsia-200 hover:underline ${
                                compact ? 'text-xs' : 'text-sm'
                            }`}
                        >
                            {SUPPORT_EMAIL}
                        </a>
                        <p className={compact ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed'}>
                            Al continuar utilizando los servicios de DameCodigo, Link4Deal o BizneAI, el usuario declara
                            haber leído, comprendido y aceptado íntegramente estos Términos y Condiciones.
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
}
