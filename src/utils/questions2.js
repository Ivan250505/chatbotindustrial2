const MENSAJES = {
    BIENVENIDA: `¡Bienvenido(a) al proceso de postulación del *Programa de Jóvenes Consultores Empresariales*! 🎓

¿Quiere formarse como consultor empresarial y trabajar con empresas reales mientras aún es estudiante?

Este no es un curso. No es una asignatura académica. Y no es una inscripción automática.

Es una convocatoria selectiva para estudiantes que sienten que las clases no siempre reflejan cómo funciona el mundo real, y que quieren aprender haciendo.

Durante 12 semanas, las personas seleccionadas harán parte de un equipo de consultoría empresarial, acompañadas por consultores de alto nivel.

Cada participante seleccionado recibirá *COP $300.000* como auxilio de transporte y reconocimiento económico.

⚠️ La participación no es automática. Postularse no garantiza ser seleccionado.`,

    CONTEXTO: `📋 *Información importante:*

Esta conversación hace parte del proceso de postulación.

Las respuestas no tienen calificación correcta o incorrecta, pero permiten identificar afinidad con el programa, nivel de compromiso y motivación.

La información será utilizada únicamente para el proceso de selección.

A continuación le haremos algunas preguntas. Responda con sinceridad.`,

    INFO_BASICA: `✅ ¡Excelente! Ha respondido todas las preguntas del programa.

Ahora necesitamos algunos datos personales para completar su postulación.`,

    CIERRE: `🎉 *¡Gracias por postularse al Programa de Jóvenes Consultores!*

Sus respuestas serán revisadas como parte del proceso de selección.

En caso de ser seleccionado(a), será contactado(a) a través del correo electrónico registrado.

¡Le deseamos mucho éxito! 🌟`
};

const PREGUNTAS = {
    1: {
        numero: 1,
        categoria: 'RELACIÓN CON LA CARRERA',
        texto: '*Pregunta 1 de 10*\n\n¿Cuál de las siguientes afirmaciones se acerca más a la forma en que percibe la carrera que estudia?',
        tipo: 'opciones',
        titulos: [
            'Resolver problemas',
            'Emprender o liderar',
            'Campo laboral estable',
            'Mejorar economía'
        ],
        opciones: [
            'Su profesión le interesa para analizar y resolver problemas reales',
            'Ve su profesión como una base para emprender o liderar proyectos',
            'Considera que su profesión ofrece amplio campo laboral y estabilidad',
            'Ve su profesión como un medio para mejorar su situación económica'
        ]
    },
    2: {
        numero: 2,
        categoria: 'MOTIVACIÓN PARA PARTICIPAR',
        texto: '*Pregunta 2 de 10*\n\n¿Cuál es la principal razón por la que desea postularse a este programa?',
        tipo: 'opciones',
        titulos: [
            'Experiencia real',
            'Algo distinto',
            'Confirmar vocación',
            'Reconocimiento económico'
        ],
        opciones: [
            'Quiere adquirir experiencia real, pero no ha encontrado cómo hacerlo',
            'Quiere probar algo distinto a las clases tradicionales',
            'Quiere confirmar si la ingeniería industrial es su camino profesional',
            'Le interesa principalmente el reconocimiento económico'
        ]
    },
    3: {
        numero: 3,
        categoria: 'DISPONIBILIDAD DE TIEMPO',
        texto: '*Pregunta 3 de 10*\n\nDurante las 12 semanas del programa, ¿cuánto tiempo semanal podría dedicar de forma constante?',
        tipo: 'opciones',
        titulos: [
            '0 a 6 horas',
            '7 a 15 horas',
            '16 a 25 horas',
            'Las horas necesarias'
        ],
        opciones: [
            'Entre 0 y 6 horas',
            'Entre 7 y 15 horas',
            'Entre 16 y 25 horas',
            'Las horas necesarias para cumplir con los objetivos'
        ]
    },
    4: {
        numero: 4,
        categoria: 'EXPECTATIVAS DE RESULTADO',
        texto: '*Pregunta 4 de 10*\n\nAl finalizar el programa, ¿cuál considera que sería el resultado más valioso para usted?',
        tipo: 'opciones',
        titulos: [
            'Experiencia en HV',
            'Ingreso económico',
            'Vocación profesional',
            'Otro resultado'
        ],
        opciones: [
            'Contar con una experiencia aplicable a la hoja de vida',
            'Obtener un ingreso económico',
            'Identificar con mayor claridad su vocación profesional',
            'Otro resultado (especificar)'
        ]
    },
    5: {
        numero: 5,
        categoria: 'FORMA DE TRABAJAR EN EQUIPO',
        texto: '*Pregunta 5 de 10*\n\nEn trabajos académicos o proyectos, ¿cuál de las siguientes frases lo describe mejor?',
        tipo: 'opciones',
        titulos: [
            'Ejecutor de tareas',
            'Organizador',
            'Criterio y claridad',
            'Trabajo individual'
        ],
        opciones: [
            'Generalmente es quien ejecuta y saca adelante las tareas',
            'Suele asumir el rol de organizar, coordinar y dar orden',
            'No siempre es el más aplicado, pero recurren a usted por criterio',
            'Prefiere trabajar solo'
        ]
    },
    6: {
        numero: 6,
        categoria: 'PRIORIDADES PERSONALES',
        texto: '*Pregunta 6 de 10*\n\nEn este momento de su vida académica, ¿qué considera más importante?',
        tipo: 'opciones',
        titulos: [
            'Formación y aprendizaje',
            'Graduarse',
            'Generar ingresos',
            'Pasión profesional'
        ],
        opciones: [
            'El proceso de formación y aprendizaje',
            'Finalizar la carrera y graduarse',
            'Generar ingresos económicos',
            'Encontrar el campo de acción que más le apasiona'
        ]
    },
    7: {
        numero: 7,
        categoria: 'EXPERIENCIA PREVIA',
        texto: '*Pregunta 7 de 10*\n\n¿Ha tenido alguna experiencia laboral, práctica o proyecto aplicado previamente?\n\nEn caso afirmativo, indique en qué área o actividad. Sea explícito, con ejemplos y fechas.\n\nSi no tiene experiencia, escriba "No tengo experiencia previa".',
        tipo: 'texto'
    },
    8: {
        numero: 8,
        categoria: 'HABILIDADES DIGITALES',
        texto: '*Pregunta 8 de 10*\n\n¿Cómo describiría su manejo de herramientas digitales (ofimática, plataformas y dispositivos tecnológicos)?',
        tipo: 'opciones',
        titulos: [
            'Avanzado',
            'Funcional',
            'Con dificultad'
        ],
        opciones: [
            'Manejo avanzado y aprendizaje autónomo de nuevas herramientas',
            'Manejo funcional: no domina todas, pero se adapta con facilidad',
            'Presenta dificultad con algunas herramientas digitales'
        ]
    },
    9: {
        numero: 9,
        categoria: 'INTELIGENCIA ARTIFICIAL',
        texto: '*Pregunta 9 de 10*\n\n¿Cómo describiría su manejo de inteligencia artificial?',
        tipo: 'opciones',
        titulos: [
            'Avanzado',
            'Funcional',
            'Con dificultad'
        ],
        opciones: [
            'Manejo avanzado y aprendizaje autónomo de nuevas herramientas',
            'Manejo funcional: no domina todas, pero se adapta con facilidad',
            'Presenta dificultad con instrucciones y generación de resultados'
        ]
    },
    10: {
        numero: 10,
        categoria: 'INTERÉS EN ÁREAS DE CONSULTORÍA',
        texto: '*Pregunta 10 de 10*\n\n¿En cuál de las siguientes áreas de consultoría le gustaría participar?',
        tipo: 'opciones',
        titulos: [
            'Producción y calidad',
            'SST',
            'Marketing',
            'Transformación digital',
            'Innovación y estrategia',
            'Gestión documental',
            'Redes sociales'
        ],
        opciones: [
            'Producción y calidad',
            'Seguridad y salud en el trabajo',
            'Marketing y análisis de mercado',
            'Transformación digital',
            'Innovación y estrategia',
            'Gestión del conocimiento: documentación',
            'Manejo de redes sociales: ideación y edición'
        ]
    }
};

module.exports = {
    MENSAJES,
    PREGUNTAS
};
