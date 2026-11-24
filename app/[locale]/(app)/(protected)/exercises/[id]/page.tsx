'use client'

import { useParams } from 'next/navigation'

import { ExerciseDetail } from '@/features/exercises/exercise-detail'

export default function ExerciseDetailPage() {
	const { id } = useParams<{ id: string }>()
	return <ExerciseDetail exerciseId={id} />
}
