import { useState } from 'react'
import { FileText, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExerciseNoteRowProps {
	note?: string | null
	onSave: (note: string) => void
	minimal?: boolean
}

export function ExerciseNoteRow({
	note,
	onSave,
	minimal = false,
}: ExerciseNoteRowProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [draft, setDraft] = useState(note || '')

	const handleOpen = () => {
		setDraft(note || '')
		setIsOpen(true)
	}

	const handleSave = () => {
		onSave(draft)
		setIsOpen(false)
	}

	return (
		<div
			className={
				minimal ? 'inline-flex' : 'flex items-center justify-between gap-3'
			}
		>
			{!minimal && (
				<div className="flex items-center gap-2 shrink-0">
					<StickyNote className="h-4 w-4 text-muted-foreground" />
					<Label className="text-sm font-medium text-muted-foreground">
						Note
					</Label>
				</div>
			)}

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 relative"
							onClick={handleOpen}
						>
							<FileText
								className={`h-4 w-4 ${
									note ? 'text-yellow-500' : 'text-muted-foreground'
								}`}
							/>
							{note && (
								<span className="absolute top-0 right-0">
									<svg
										width="6"
										height="6"
										viewBox="0 0 10 10"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<circle
											cx="4"
											cy="4"
											r="4"
											fill="#FACC15"
											stroke="#FFF"
											strokeWidth="0"
										/>
										<text
											x="4"
											y="6"
											textAnchor="middle"
											fontSize="5"
											fill="#FFF"
											fontWeight="bold"
										>
											!
										</text>
									</svg>
								</span>
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{note ? 'Edit note' : 'Add note'}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Exercise Note</DialogTitle>
					</DialogHeader>
					<Textarea
						value={draft}
						onChange={e => setDraft(e.target.value)}
						placeholder="Add a note about this exercise..."
						className="min-h-[120px]"
						rows={5}
					/>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSave}>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
