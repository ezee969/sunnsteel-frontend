import type { LegalDocument, LegalFacts } from './legal-facts'

/**
 * BILL-07: the binding texts, in Spanish (the owner's decision at claim).
 * Drafted for the owner's review; a lawyer should read them before real
 * charges are switched on. Every number comes from `LegalFacts`.
 */

export function termsEs(f: LegalFacts): LegalDocument {
	return {
		title: 'Términos y condiciones',
		sections: [
			{
				heading: 'Consultas y reclamos',
				blocks: [
					`Para consultas y reclamos sobre Sunnsteel puedes escribir a ${f.email}.`,
				],
			},
			{
				heading: 'Aceptación',
				blocks: [
					'Al crear una cuenta o usar Sunnsteel aceptas estos términos y la [Política de privacidad](/privacidad). Si no estás de acuerdo, no uses el servicio.',
				],
			},
			{
				heading: 'Edad',
				blocks: [
					`Debes tener al menos ${f.minimumAge} años para usar Sunnsteel. Si tienes menos de 18, necesitas la autorización de tu madre, padre o tutor para contratar Sunnsteel Pro.`,
				],
			},
			{
				heading: 'Tu cuenta',
				blocks: [
					'Usa datos verdaderos y cuida el acceso a tu cuenta: eres responsable de lo que se haga con ella. Puedes exportar todos tus datos y eliminar tu cuenta en cualquier momento desde Ajustes.',
				],
			},
			{
				heading: 'El servicio',
				blocks: [
					'Sunnsteel sirve para planificar y registrar entrenamientos, seguir tu progreso y compartirlo con otros miembros según tus ajustes de privacidad. Podemos mejorar, cambiar o dejar de ofrecer funciones; si un cambio afecta algo que ya pagaste, te avisaremos con anticipación.',
				],
			},
			{
				heading: 'Planes, precio y prueba gratis',
				blocks: [
					`El plan Free no tiene costo. Sunnsteel Pro es una suscripción mensual de ${f.price} por mes, precio final en pesos argentinos, que se paga por Mercado Pago. Nunca vemos ni guardamos los datos de tu tarjeta.`,
					`La primera suscripción de cada cuenta empieza con ${f.trialDays} días de prueba gratis: si no cancelas antes de que terminen, se cobra el primer mes. Después la suscripción se renueva sola cada mes hasta que la canceles.`,
					'Si cambiamos el precio, te avisaremos al menos 30 días antes de que se aplique, y podrás cancelar antes.',
					'Mientras los pagos funcionen en el modo de prueba de Mercado Pago, la app lo indica en cada lugar donde se ofrece Pro y no se cobra dinero real.',
				],
			},
			{
				heading: 'Pagos que fallan',
				blocks: [
					`Si un cobro de renovación falla, conservas Pro durante ${f.graceDays} días mientras Mercado Pago lo reintenta, y te avisamos en la app. Si no se puede cobrar, pasas a Free sin perder ningún dato.`,
				],
			},
			{
				heading: 'Cancelar la suscripción',
				blocks: [
					'Puedes cancelar cuando quieras desde Ajustes o desde el [Botón de baja](/baja), incluso sin iniciar sesión. Pro sigue hasta el final del período que ya pagaste y no se vuelve a cobrar. Cancelar no borra nada de lo que creaste.',
				],
			},
			{
				heading: 'Derecho de arrepentimiento',
				blocks: [
					`Puedes revocar la contratación de Sunnsteel Pro dentro de los ${f.revocationDays} días corridos desde que la hiciste, sin dar motivos y sin costo, como establecen el artículo 34 de la Ley 24.240 de Defensa del Consumidor y el artículo 1110 del Código Civil y Comercial. Usa el [Botón de arrepentimiento](/arrepentimiento): te damos un código al instante y te devolvemos lo cobrado. Los detalles están en la [Política de reembolsos](/reembolsos).`,
				],
			},
			{
				heading: 'Miembros fundadores',
				blocks: [
					'Las cuentas que ya existían cuando se lanzó Pro, en octubre de 2026, tienen Pro sin costo y sin vencimiento como miembros fundadores.',
				],
			},
			{
				heading: 'Uso aceptable',
				blocks: [
					'Al usar Sunnsteel te comprometes a no:',
					{
						list: [
							'acosar, amenazar o discriminar a otros miembros;',
							'publicar contenido ilegal, de odio o sexual, ni hacerte pasar por otra persona;',
							'usar el servicio para enviar spam o automatizar su uso de forma abusiva;',
							'intentar acceder a cuentas o datos ajenos, o vulnerar la seguridad del servicio.',
						],
					},
					'Puedes reportar contenido y bloquear a otros miembros. La moderación puede ocultar contenido o restringir los mensajes de una cuenta que no cumpla estas reglas, y cada decisión queda registrada.',
				],
			},
			{
				heading: 'Tu contenido',
				blocks: [
					'Lo que creas en Sunnsteel (rutinas, entrenamientos, notas, mensajes) sigue siendo tuyo. Nos das permiso para guardarlo y mostrarlo solo como haga falta para prestar el servicio y según tus ajustes de privacidad. Si compartes una rutina, otros miembros pueden copiarla en una rutina propia e independiente.',
				],
			},
			{
				heading: 'Salud',
				blocks: [
					'Sunnsteel no da consejo médico ni reemplaza a un profesional de la salud o del entrenamiento. Consulta a uno antes de empezar o cambiar un programa, sobre todo si tienes una lesión o una condición médica. Entrenas bajo tu propia responsabilidad. Las sugerencias de la app y los borradores de rutinas generados con inteligencia artificial son orientativos.',
				],
			},
			{
				heading: 'Disponibilidad',
				blocks: [
					'Hacemos lo posible para que Sunnsteel funcione siempre, pero puede haber interrupciones o errores. Nada en estos términos limita los derechos que te reconoce la Ley de Defensa del Consumidor.',
				],
			},
			{
				heading: 'Cambios a estos términos',
				blocks: [
					'Si cambiamos estos términos, te avisaremos en la app con anticipación razonable. Si no estás de acuerdo con los nuevos, puedes cancelar tu suscripción y eliminar tu cuenta.',
				],
			},
			{
				heading: 'Ley aplicable y reclamos',
				blocks: [
					'Estos términos se rigen por las leyes de la República Argentina. Para cualquier conflicto son competentes los tribunales que corresponden según la Ley 24.240, incluidos los de tu domicilio.',
					`Antes de reclamar en otra instancia puedes escribirnos a ${f.email}. También puedes acudir a la autoridad de defensa del consumidor de tu jurisdicción.`,
				],
			},
		],
	}
}

export function privacyEs(f: LegalFacts): LegalDocument {
	return {
		title: 'Política de privacidad',
		sections: [
			{
				heading: 'Contacto sobre tus datos',
				blocks: [
					`Puedes escribir a ${f.email} por cualquier consulta sobre tus datos.`,
				],
			},
			{
				heading: 'Qué datos tratamos',
				blocks: [
					{
						list: [
							'Cuenta: email, nombre, nombre de usuario, foto de perfil, idioma, zona horaria y preferencias.',
							'Entrenamiento: rutinas, entrenamientos, series, notas, objetivos y mediciones corporales que registres.',
							'Social: a quién sigues y quién te sigue, actividad, comentarios, mensajes directos, reportes y bloqueos.',
							'Pagos: el estado de tu suscripción y los identificadores de Mercado Pago. Nunca recibimos los datos de tu tarjeta.',
							'Técnicos: registros de errores con tu dirección IP y tu navegador, para seguridad y para corregir fallas.',
							'Pedidos de arrepentimiento o de baja: el nombre, el email y la referencia que escribas.',
						],
					},
				],
			},
			{
				heading: 'Para qué los usamos',
				blocks: [
					'Para prestar el servicio y mostrarte tu progreso, para las funciones sociales según tus ajustes de privacidad, para cobrar Sunnsteel Pro, para la seguridad y la moderación, y para cumplir obligaciones legales como la facturación. No vendemos tus datos ni los usamos para publicidad.',
				],
			},
			{
				heading: 'Quién los procesa',
				blocks: [
					'Usamos estos proveedores, que tratan datos por nuestra cuenta y solo para prestar el servicio:',
					{
						list: [
							'Supabase: inicio de sesión y fotos de perfil.',
							'Railway: el servidor y la base de datos.',
							'Vercel: el alojamiento de la web.',
							'Sentry: el registro de errores.',
							'Mercado Pago: los pagos de la suscripción.',
							'Google: solo si inicias sesión con Google.',
							'Anthropic: solo el texto que escribes para pedir un borrador de rutina; no se guarda.',
						],
					},
				],
			},
			{
				heading: 'Transferencia internacional',
				blocks: [
					'Estos proveedores alojan datos fuera de Argentina, por ejemplo en Estados Unidos. Elegimos proveedores que se comprometen a proteger los datos que tratan por nuestra cuenta.',
				],
			},
			{
				heading: 'Quién ve qué',
				blocks: [
					'Tus ajustes de privacidad deciden qué ve cada persona de tu perfil y tu actividad, y puedes cambiarlos en cualquier momento. Los mensajes directos se guardan en nuestro servidor y no están cifrados de extremo a extremo. Si alguien reporta un mensaje, la moderación puede leer ese mensaje y hasta cinco anteriores de esa conversación.',
				],
			},
			{
				heading: 'Cuánto tiempo los conservamos',
				blocks: [
					'Mientras tengas una cuenta. Si la eliminas, se borra de inmediato todo lo tuyo, salvo lo que debamos conservar por obligación legal, como los registros de facturación, y los pedidos de arrepentimiento o de baja, que se conservan como constancia. Las notificaciones se borran a los 90 días.',
				],
			},
			{
				heading: 'Tus derechos',
				blocks: [
					`Puedes acceder a tus datos, rectificarlos, actualizarlos o pedir que se supriman, como establece la Ley 25.326 de Protección de los Datos Personales. Desde Ajustes puedes exportarlos y eliminar tu cuenta; para lo demás, escribe a ${f.email}. El acceso es gratuito a intervalos no inferiores a seis meses, salvo que acredites un interés legítimo.`,
					'La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.',
				],
			},
			{
				heading: 'Edad',
				blocks: [
					`Sunnsteel no está dirigido a menores de ${f.minimumAge} años.`,
				],
			},
			{
				heading: 'Cookies y almacenamiento',
				blocks: [
					'Usamos solo las cookies y el almacenamiento del navegador que hacen falta para que la app funcione: tu sesión, tu idioma y tus preferencias de pantalla. No usamos cookies de publicidad ni de seguimiento.',
				],
			},
			{
				heading: 'Cambios',
				blocks: [
					'Si cambiamos esta política, te avisaremos en la app antes de que se aplique.',
				],
			},
		],
	}
}

export function refundsEs(f: LegalFacts): LegalDocument {
	return {
		title: 'Política de reembolsos',
		sections: [
			{
				heading: 'Arrepentimiento: los primeros días',
				blocks: [
					`Puedes revocar la contratación de Sunnsteel Pro dentro de los ${f.revocationDays} días corridos desde que la hiciste, sin dar motivos. Cancelamos la suscripción y te devolvemos todo lo cobrado, por el mismo medio de pago.`,
					`Para pedirlo usa el [Botón de arrepentimiento](/arrepentimiento), sin necesidad de iniciar sesión, o escribe a ${f.email}. Te damos un código al instante como constancia de tu pedido.`,
					'Si todavía estás en la prueba gratis y no se cobró nada, alcanza con cancelar la suscripción.',
				],
			},
			{
				heading: 'Después de ese plazo',
				blocks: [
					'No devolvemos los períodos ya empezados. Al cancelar, Pro sigue hasta el final del período que ya pagaste y no se vuelve a cobrar. Puedes hacerlo desde Ajustes o desde el [Botón de baja](/baja).',
				],
			},
			{
				heading: 'Cobros por error',
				blocks: [
					`Si se te cobró dos veces o después de cancelar, escríbenos a ${f.email} y te devolvemos el importe completo.`,
				],
			},
			{
				heading: 'Cómo se devuelve',
				blocks: [
					'Los reembolsos se hacen por Mercado Pago, al mismo medio de pago que usaste. El tiempo en que el dinero aparece en tu cuenta o tu tarjeta depende de Mercado Pago y de tu banco.',
				],
			},
			{
				heading: 'Contacto',
				blocks: [`Email: ${f.email}.`],
			},
		],
	}
}
