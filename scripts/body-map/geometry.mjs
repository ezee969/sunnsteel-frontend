// PROG-15: the body map's figure, front and back, drawn for Sunnsteel.
//
// Every shape is drawn once, for the figure's right half (x >= 100 in a
// 200 x 460 box; the generator widens it for the open arms), as SVG path data using only absolute M, C, L and Z, and
// mirrored by the generator, so the figure is symmetric by construction.
// A muscle may have several plates: the abdominal blocks are all CORE, and the
// heads of a muscle are separate plates so the seams between them show.

export const WIDTH = 200
export const HEIGHT = 460

/**
 * The outline's right half, from the top of the head to the crotch, in three
 * parts: the arm is drawn hanging and turned out by the generator around
 * ARM_PIVOT, together with the arm's plates and details, so the figure stands
 * with its arms open. The generator closes the outline with its own mirror.
 */
export const OUTLINE_TOP = [
	// One head is an eighth of the figure (8 to 63 of 8 to 452), the
	// classical canon: chin at 1, chest at 2, navel at 3, knee near 6.
	'M 100 8',
	'C 111 8 119 16 119 29', // skull
	'C 119 34 118 38 117 41', // temple
	'C 119 41 121 44 120 48', // ear
	'C 119 52 117 54 115 54', // ear lobe
	'C 115 58 113 62 113 66', // angle of the jaw into the neck
	'C 113 69 113 71 114 73', // neck
	'C 122 77 134 80 146 85', // trapezius slope
	'C 158 88 167 100 167 116', // deltoid; its end turns with the arm
].join(' ')

export const OUTLINE_ARM = [
	'C 169 134 171 160 171 182', // upper arm, outside
	'C 176 196 181 220 180 250', // forearm, outside
	// A hand is about three quarters of a head.
	'C 184 253 188 258 189 263', // thumb
	'C 190 267 186 268 184 265', // thumb tip
	'C 185 275 185 284 183 290', // fingers, outside
	'C 181 296 175 297 173 292', // fingertips
	'C 171 284 169 272 168 260', // palm, inside
	'C 166 238 160 214 156 198', // forearm, inside
	'C 152 182 149 154 146 132', // upper arm, inside, to the armpit
].join(' ')

export const OUTLINE_BOTTOM = [
	'C 145 150 139 174 135 198', // flank to the waist
	'C 134 210 139 222 142 238', // hip
	'C 148 262 144 298 132 330', // thigh, outside
	'C 129 338 130 346 134 358', // knee to the calf
	'C 141 374 136 402 122 424', // calf to the ankle
	'C 125 436 129 446 123 450', // foot, outside
	'C 117 453 108 453 105 449', // sole
	'C 104 442 106 432 106 424', // foot, inside
	'C 102 404 97 384 101 362', // calf, inside
	'C 103 350 107 342 106 334', // knee, inside
	'C 103 300 102 268 100 246', // thigh, inside, to the crotch
].join(' ')

/** The shoulder joint the arm turns around, and by how much (degrees). */
export const ARM_PIVOT = [152, 112]
export const ARM_ANGLE = -15

/** Muscles whose plates are on the arm and turn with it. */
export const ARM_MUSCLES = ['BICEPS', 'TRICEPS', 'FOREARMS']

/**
 * Anatomical lines that are not region edges, drawn as seams over the plates.
 * `arm: true` turns with the arm.
 */
export const DETAILS = {
	FRONT: [
		{ d: 'M 115 53 C 112 59 106 63 100 64' }, // jaw and chin
		{ d: 'M 113 58 C 110 68 105 79 102 88' }, // sternocleidomastoid
		{ d: 'M 128 146 L 137 143' }, // serratus
		{ d: 'M 127 156 L 137 152' },
		{ d: 'M 126 166 L 136 162' },
		{ d: 'M 111 334 C 113 342 124 342 127 334' }, // kneecap
		{ d: 'M 117 352 C 119 372 118 392 115 410' }, // tibialis
		{ d: 'M 166 207 C 171 221 174 236 175 250', arm: true }, // brachioradialis
		{ d: 'M 158 192 C 162 194 166 195 170 194', arm: true }, // elbow crease
	],
	BACK: [
		{ d: 'M 114 55 C 109 59 104 60 100 60' }, // base of the skull
		{ d: 'M 122 120 C 129 118 136 117 142 116' }, // infraspinatus
		{ d: 'M 109 336 C 116 339 124 339 131 335' }, // back of the knee
		{ d: 'M 113 404 C 114 412 114 420 113 428' }, // Achilles tendon
		{ d: 'M 158 141 C 161 155 161 168 159 182', arm: true }, // triceps heads
		{ d: 'M 158 192 C 162 196 166 197 170 195', arm: true }, // elbow
	],
}

export const FRONT = {
	TRAPEZIUS: [
		'M 111 70 C 114 76 121 79 132 82 C 137 83 141 84 144 86 C 131 88 119 89 108 89 C 107 82 108 74 110 68 Z',
	],
	PECTORAL: [
		'M 102 92 C 113 88 126 88 135 91 C 141 96 143 105 143 114 C 142 124 138 131 131 135 C 121 141 109 140 102 136 C 101 122 101 105 102 92 Z',
	],
	ANTERIOR_DELTOIDS: [
		'M 137 88 C 144 85 152 86 156 92 C 158 104 156 118 150 131 C 145 122 143 112 143 103 C 142 96 140 91 137 88 Z',
	],
	MEDIAL_DELTOIDS: [
		'M 158 92 C 164 97 167 106 167 116 C 167 124 164 130 160 134 C 157 133 155 132 153 131 C 158 118 160 104 158 92 Z',
	],
	BICEPS: [
		'M 150 136 C 156 133 162 134 166 139 C 169 153 170 166 168 178 C 165 185 160 189 156 190 C 152 178 150 162 149 150 C 148 144 148 140 150 136 Z',
	],
	FOREARMS: [
		'M 158 199 C 165 195 174 197 177 205 C 180 220 181 236 179 250 C 176 253 172 254 169 253 C 166 238 162 220 159 208 C 157 204 157 201 158 199 Z',
	],
	CORE: [
		// Rectus abdominis, four blocks
		'M 103 141 C 109 140 115 140 119 142 L 119 157 C 114 158 108 158 103 158 Z',
		'M 103 161 C 108 161 114 161 119 160 L 119 177 C 114 178 108 178 103 178 Z',
		'M 103 181 C 108 181 114 181 119 180 L 118 198 C 113 199 108 199 103 199 Z',
		'M 103 202 C 108 202 113 202 118 201 C 117 214 113 225 106 233 C 104 233 103 231 103 227 Z',
		// Serratus and the external oblique
		'M 122 141 C 129 139 137 137 142 140 C 141 158 137 180 134 198 C 133 208 128 216 121 222 C 121 196 122 168 122 141 Z',
	],
	ADDUCTOR: [
		'M 103 240 C 108 238 113 240 116 245 C 115 262 112 280 108 294 C 105 288 103 278 103 264 Z',
	],
	QUADRICEPS: [
		// Rectus femoris
		'M 120 240 C 126 237 133 239 135 247 C 136 268 133 292 127 316 C 125 322 121 324 118 321 C 117 300 117 282 117 266 C 117 256 118 247 120 240 Z',
		// Vastus lateralis
		'M 138 243 C 143 244 147 251 147 262 C 147 284 142 306 132 324 C 130 325 129 324 129 321 C 133 298 137 272 138 243 Z',
		// Vastus medialis
		'M 115 282 C 116 296 117 308 117 322 C 114 330 108 329 107 321 C 106 308 109 294 115 282 Z',
	],
	CALVES: [
		'M 103 348 C 107 346 111 352 112 362 C 112 378 110 392 108 404 C 103 398 100 386 100 372 Z',
		'M 126 344 C 134 350 140 364 138 380 C 136 394 129 404 123 410 C 122 390 123 366 126 344 Z',
	],
}

export const BACK = {
	TRAPEZIUS: [
		'M 101 66 C 104 72 109 76 115 79 C 125 82 136 84 145 87 C 137 93 127 100 119 108 C 112 121 106 138 101 158 Z',
	],
	REAR_DELTOIDS: [
		'M 139 92 C 145 88 152 89 156 93 C 158 105 156 118 152 130 C 146 122 141 112 138 102 C 137 98 138 95 139 92 Z',
	],
	MEDIAL_DELTOIDS: [
		'M 158 93 C 164 97 167 106 167 116 C 167 124 164 130 160 134 C 158 133 156 132 154 131 C 158 118 160 105 158 93 Z',
	],
	TERES_MAJOR_MINOR: [
		'M 119 112 C 125 104 133 101 139 105 C 143 112 144 120 142 127 C 135 132 126 133 119 129 C 118 123 118 117 119 112 Z',
	],
	LATISSIMUS_DORSI: [
		'M 113 133 C 123 136 134 135 144 130 C 145 150 141 170 136 190 C 129 197 120 202 110 205 C 109 185 109 160 113 133 Z',
	],
	ERECTOR_SPINAE: [
		'M 102 161 C 105 160 107 162 108 166 C 108 186 108 206 107 226 C 105 228 103 228 102 226 Z',
	],
	CORE: [
		'M 137 193 C 138 203 139 213 140 223 C 130 219 119 218 110 220 C 112 214 112 210 111 207 C 121 204 130 199 137 193 Z',
	],
	TRICEPS: [
		'M 151 135 C 157 132 163 135 166 141 C 169 154 170 167 168 180 C 165 187 159 190 155 187 C 152 172 150 152 151 135 Z',
	],
	FOREARMS: [
		'M 158 197 C 165 194 174 197 177 205 C 180 220 181 236 179 250 C 176 253 172 254 169 253 C 166 238 162 220 159 208 C 157 203 157 200 158 197 Z',
	],
	GLUTES: [
		'M 102 226 C 113 215 131 215 141 226 C 144 239 142 252 135 262 C 124 268 110 268 102 263 C 101 250 101 237 102 226 Z',
	],
	ADDUCTOR: [
		'M 101 266 C 103 266 105 267 106 269 C 106 284 107 298 108 310 C 105 304 103 292 102 280 Z',
	],
	HAMSTRINGS: [
		// Semitendinosus and semimembranosus
		'M 107 270 C 112 272 117 273 121 273 C 121 292 120 311 119 331 C 115 332 112 330 110 326 C 108 307 107 289 107 270 Z',
		// Biceps femoris
		'M 124 272 C 131 271 138 268 143 263 C 145 286 140 308 131 326 C 128 330 125 331 122 331 C 123 311 124 291 124 272 Z',
	],
	CALVES: [
		// Gastrocnemius, inner head
		'M 103 346 C 107 337 115 336 119 339 C 120 356 119 377 117 399 C 113 405 108 403 106 397 C 101 383 100 362 103 346 Z',
		// Gastrocnemius, outer head
		'M 122 340 C 129 338 137 343 139 354 C 142 370 137 388 127 399 C 124 402 121 402 120 400 C 122 379 123 358 122 340 Z',
	],
}
