import { LayoutTemplate } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
	describeTemplateSize,
	ROUTINE_TEMPLATES,
} from '@/lib/utils/routine-templates'

/**
 * ROUT-03: the curated starter programmes, each opening the routine wizard as
 * an editable draft. Repeated row controls, so every one is an outline.
 */
export function StarterTemplates({
	headingLevel = 'h3',
}: {
	headingLevel?: 'h2' | 'h3'
}) {
	const Heading = headingLevel
	return (
		<section aria-labelledby="starter-templates" className="space-y-2">
			<div>
				<Heading
					id="starter-templates"
					className="type-section text-foreground"
				>
					Start from a template
				</Heading>
				<p className="type-body-sm mt-1 text-ink-3">
					Each opens as a draft you can change before saving. Loads are left for
					you to fill in.
				</p>
			</div>
			<ul>
				{ROUTINE_TEMPLATES.map(template => (
					<li
						key={template.slug}
						className="rule-row flex flex-wrap items-center gap-3 py-3"
					>
						<div className="min-w-0 flex-1 basis-56 text-left">
							<p className="type-panel text-foreground">{template.name}</p>
							<p className="type-body-sm text-ink-2">
								{template.summary} · {describeTemplateSize(template)}
							</p>
							<p className="type-body-sm text-ink-3">{template.description}</p>
						</div>
						<Button asChild variant="outline" size="sm">
							<Link
								href={`/routines/new?template=${template.slug}`}
								aria-label={`Use the ${template.name} template`}
							>
								<LayoutTemplate aria-hidden />
								Use template
							</Link>
						</Button>
					</li>
				))}
			</ul>
		</section>
	)
}
