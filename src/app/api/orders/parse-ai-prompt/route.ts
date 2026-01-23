import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

// AI Configuration
const AI_MODEL = 'claude-sonnet-4-20250514';
const AI_MAX_TOKENS = 2048; // Increased to accommodate comprehensive order data

/**
 * System prompt for extracting dental order information from natural language
 * Returns a JSON object with structured dental order fields
 */
function getDentalOrderExtractionPrompt(): string {
  const today = new Date().toISOString().split('T')[0];

  return `Eres un asistente especializado en extraer información de órdenes dentales.
Tu tarea es analizar el texto en lenguaje natural y extraer la información estructurada de una orden dental, además de generar sugerencias inteligentes basadas en el contexto.

IMPORTANTE - Configuración por Diente:
- Cada diente puede tener diferente material, color, tipo de trabajo, y configuración de implante
- Si el prompt menciona configuraciones DIFERENTES para cada diente, crea un array "teeth" con objetos separados
- Si el prompt menciona la MISMA configuración para todos los dientes, crea un array "teeth" con un objeto por cada diente pero con los mismos valores
- Ejemplos:
  * "Corona de zirconia A2 para 11 y puente de e-max A3 para 21-22" → teeth con 3 objetos (11 con zirconia A2, 21 y 22 con e-max A3)
  * "Coronas de zirconia A2 para 11, 12, 21" → teeth con 3 objetos (todos con zirconia A2)
  * "Implante con corona para 11 y corona regular para 12" → teeth con 2 objetos (11 con trabajoSobreImplante true, 12 con false)

Debes devolver ÚNICAMENTE un objeto JSON válido con los siguientes campos (todos opcionales):
{
  "patientName": "Nombre completo del paciente",
  "patientId": "ID o número de paciente",
  "fechaEntregaDeseada": "Fecha en formato YYYY-MM-DD",
  "teethNumbers": "Números de dientes separados por coma (ej: 11, 12, 21)",
  "description": "Descripción general del caso",
  "notes": "Notas adicionales o instrucciones especiales",

  "tipoCaso": "nuevo" o "garantia",
  "motivoGarantia": "Razón de la garantía (solo si tipoCaso es 'garantia')",
  "seDevuelveTrabajoOriginal": true o false (si devuelven el trabajo original en garantía),

  "scanType": "DIGITAL_SCAN" o "ANALOG_MOLD",
  "escanerUtilizado": "iTero", "Medit", "ThreeShape", "Carestream", u "Otro",
  "otroEscaner": "Nombre del escáner si es 'Otro'",
  "tipoSilicon": "adicion" o "condensacion" (solo para moldes análogos),
  "notaModeloFisico": "Observaciones sobre el modelo físico (solo para moldes análogos)",

  "teeth": [
    {
      "toothNumber": "Número de diente (ej: 11, 12, 21)",
      "tipoTrabajo": "restauracion" u "otro",
      "tipoRestauracion": "corona", "puente", "inlay", "onlay", "carilla", o "provisional",
      "material": "Material como Zirconia, Porcelana, Disilicato de litio, etc",
      "trabajoSobreImplante": true o false,
      "informacionImplante": {
        "marcaImplante": "Marca del implante (ej: Straumann, Nobel Biocare)",
        "sistemaConexion": "Sistema de conexión (ej: Internal hex, External hex)",
        "numeroImplantes": número de implantes (1, 2, 3, etc),
        "tipoRestauracion": "individual", "ferulizada", o "hibrida",
        "tipoAditamento": "estandar", "personalizado", o "multi_unit",
        "perfilEmergencia": "recto", "concavo", o "convexo",
        "condicionTejidoBlando": "sano", "inflamado", o "retraido",
        "radiografiaPeriapical": "Descripción o ubicación de la radiografía",
        "cbct": "Descripción o ubicación del CBCT"
      },
      "colorInfo": {
        "shadeType": SOLO uno de: "VITAPAN_CLASSICAL", "VITAPAN_3D_MASTER", "IVOCLAR_CHROMASCOP", "IVOCLAR_AD_BLEACH", "KURARAY_NORITAKE", "TRUBYTE_BIOFORM", "DURATONE" - o null si no se especifica. Por defecto usar "VITAPAN_CLASSICAL" si mencionan códigos tipo A2, B1, etc.,
        "shadeCode": "Código(s) de color EXACTAMENTE como los menciona el usuario. Puede ser un solo código (ej: 'A2') o múltiples códigos (ej: 'A2 B2', 'cervical A3 body A2', 'A2/A3'). NO extraigas solo el primer valor - incluye TODOS los códigos mencionados tal cual.",
        "colorimeter": "Nombre del colorímetro (opcional)",
        "texture": ["lisa"] o ["rugosa"] o ["natural"] o cualquier combinación - DEBE SER UN ARRAY,
        "gloss": ["brillante"] o ["mate"] o ["satinado"] o cualquier combinación - DEBE SER UN ARRAY,
        "mamelones": EXACTAMENTE "si" o "no",
        "translucency": {
          "level": número del 1 al 10,
          "description": "descripción de translucidez"
        }
      }
    }
  ],

  "submissionType": "prueba_estructura", "prueba_estetica", o "terminado",
  "articulatedBy": "doctor" o "laboratorio",

  "oclusionDiseno": {
    "tipoOclusion": SOLO usa uno de estos valores exactos: "normal", "clase_i", "clase_ii", "clase_iii", "borde_a_borde", "mordida_cruzada",
    "espacioInteroclusalSuficiente": true o false,
    "solucionEspacioInsuficiente": "reduccion_oclusal", "aumento_vertical", o "ambas" (opcional)
  },

  "colorInfo": {
    "shadeType": SOLO uno de: "VITAPAN_CLASSICAL", "VITAPAN_3D_MASTER", "IVOCLAR_CHROMASCOP", "IVOCLAR_AD_BLEACH", "KURARAY_NORITAKE", "TRUBYTE_BIOFORM", "DURATONE" - o null si no se especifica. Por defecto usar "VITAPAN_CLASSICAL" si mencionan códigos tipo A2, B1, etc.,
    "shadeCode": "Código(s) de color EXACTAMENTE como los menciona el usuario. Puede ser un solo código (ej: 'A2') o múltiples (ej: 'A2 B2', 'cervical A3 body A2'). Incluye TODOS los códigos mencionados, no solo el primero.",
    "colorimeter": "Nombre del colorímetro (opcional)",
    "texture": ["lisa"] o ["rugosa"] o ["natural"] o cualquier combinación - DEBE SER UN ARRAY,
    "gloss": ["brillante"] o ["mate"] o ["satinado"] o cualquier combinación - DEBE SER UN ARRAY,
    "mamelones": EXACTAMENTE "si" o "no",
    "translucency": {
      "level": número del 1 al 10,
      "description": "descripción de translucidez"
    }
  },

  "materialSent": {
    // IMPRESIONES - marca true solo las que se mencionan explícitamente
    "antagonista": true/false - si envían impresión de antagonista,
    "arcada_completa_metalica_rigida": true/false - impresión arcada completa en cucharilla metálica rígida,
    "arcada_completa_plastica_rigida": true/false - impresión arcada completa en cucharilla plástica rígida,
    "arcada_completa_aluminio": true/false - impresión arcada completa en cucharilla de aluminio,
    "arcada_completa_personalizada": true/false - impresión arcada completa en cucharilla personalizada,
    "parcial_metalica_rigida": true/false - impresión parcial en cucharilla metálica rígida,
    "parcial_plastica_rigida": true/false - impresión parcial en cucharilla plástica rígida,
    "parcial_aluminio": true/false - impresión parcial en cucharilla de aluminio,
    "cucharilla_doble": true/false - impresión en cucharilla doble,

    // MODELOS - marca true solo los que se mencionan
    "modelo_solido": true/false - modelo sólido,
    "modelo_solido_reingreso": true/false - modelo sólido para reingreso,
    "modelo_articulado": true/false - modelo articulado,
    "modelo_encerado_prototipo": true/false - modelo con encerado o prototipo,

    // REGISTROS - marca true solo los que se mencionan
    "registro_mordida": true/false - registro de mordida,
    "registro_oclusal": true/false - registro oclusal,
    "registro_silicon": true/false - registro en silicón,
    "registro_cera": true/false - registro en cera,

    // ARCHIVOS - marca true solo los que se mencionan
    "fotografia": true/false - fotografía del caso,
    "radiografia": true/false - radiografía del caso
  }
}

Reglas CRÍTICAS:
- SOLO incluye en el JSON los campos para los que encuentres información EXPLÍCITA en el prompt
- NO incluyas campos con valores null, undefined, o vacíos
- Si no encuentras información para un campo, NO lo incluyas en el JSON de respuesta
- Las fechas deben estar en formato YYYY-MM-DD
- Para fechas relativas (ej: "en 5 días"), calcula la fecha desde hoy (${today})
- Los números de dientes deben estar en notación FDI (11-48) o Universal (1-32)

IMPORTANTE - Array "teeth" (Configuración por Diente):
- SIEMPRE crea un objeto separado en el array "teeth" por cada número de diente mencionado
- Si el prompt dice "coronas de zirconia para 11, 12, 21", crea 3 objetos en el array teeth (uno para 11, uno para 12, uno para 21)
- Cada objeto en "teeth" DEBE tener "toothNumber" como campo requerido
- Si todos los dientes tienen la misma configuración, repite los mismos valores en cada objeto del array
- Si algunos dientes tienen configuraciones diferentes, asigna los valores correctos a cada objeto según lo que se mencione en el prompt
- SOLO incluye campos dentro de cada objeto tooth si hay información explícita para ese diente

IMPORTANTE - Formato de valores:
- Para "tipoOclusion": USA SOLO los valores EXACTOS permitidos. Si mencionan "mordida profunda", mapea a "mordida_cruzada" o "clase_ii" según el contexto.
- Para "texture" y "gloss" (dentro de colorInfo): SIEMPRE devuelve un ARRAY, aunque sea de un solo elemento: ["lisa"] NO "lisa"
- Para "translucency" (dentro de colorInfo): SIEMPRE incluye "description" aunque sea genérica como "translucidez media"
- Para enums de implantes: usa EXACTAMENTE los valores especificados en minúsculas con guiones bajos

IMPORTANTE - materialSent (Materiales Enviados):
- SOLO incluye las keys que tengan valor true, NO incluyas las que son false
- Busca menciones de: impresiones, modelos, registros de mordida, fotografías, radiografías
- Palabras clave: "envío", "adjunto", "incluyo", "mando", "llevo", "con impresión", "con modelo", "con registro"
- Si mencionan "impresión en cucharilla metálica" sin especificar arcada, usa "arcada_completa_metalica_rigida"
- Si mencionan "modelo" sin más detalles, usa "modelo_solido"
- Si mencionan "registro" o "mordida" sin especificar material, usa "registro_mordida"
- Ejemplos de mapeo:
  * "con fotografías" → fotografia: true
  * "incluyo radiografía" → radiografia: true
  * "envío modelo articulado" → modelo_articulado: true
  * "impresión de antagonista y registro oclusal" → antagonista: true, registro_oclusal: true

- Sé preciso y conservador - si no estás 100% seguro de un valor enum, omite ese campo
- Devuelve SOLO el JSON con los campos que pudiste extraer con certeza
- NO inventes información - solo extrae lo que está explícitamente mencionado

SUGERENCIAS INTELIGENTES:
Además del JSON principal con los valores confirmados, genera un array "suggestions" con sugerencias inteligentes basadas en el contexto.

Reglas para las sugerencias:
1. SOLO sugiere cuando hay contexto suficiente pero información incompleta
2. Alta confianza solamente (>80%)
3. Máximo 5 sugerencias más valiosas
4. PRIORIDAD MÁXIMA: Sugerencias para campos REQUERIDOS faltantes
5. Prioriza sugerencias que eviten errores comunes o completen información faltante

CAMPOS REQUERIDOS que DEBES sugerir si faltan:
- patientName: Si no se proporciona nombre del paciente, sugiere recordatorio
- teethNumbers: Si no se especifican dientes, sugiere que los indique
- scanType: Si no se especifica tipo de impresión, sugiere "DIGITAL_SCAN" (más común en órdenes modernas)
- Para scanType="DIGITAL_SCAN": SIEMPRE sugiere un recordatorio sobre subir archivos STL (Superior e Inferior) - usa field="_fileUploadReminder"

RECORDATORIOS ESPECIALES (no son campos aplicables, solo informativos):
- Para recordar subir archivos STL: usa field="_fileUploadReminder", value con mensaje descriptivo, confidence=100
- Estos recordatorios NO se pueden aplicar con "Aplicar", solo informan al usuario

Formato de cada sugerencia:
{
  "field": "ruta.del.campo",
  "value": valor_sugerido,
  "label": "Etiqueta legible para mostrar en UI",
  "reason": "Explicación clara de por qué se sugiere esto",
  "confidence": 85,
  "category": "order" | "tooth",
  "toothNumber": "11"  // solo si category es "tooth"
}

Ejemplos de cuándo SUGERIR (PRIORIDAD DE ARRIBA HACIA ABAJO):

PRIORIDAD 1 - Campos requeridos faltantes:
- No hay nombre de paciente → sugiere field: "patientName", value: null, label: "Nombre del Paciente", reason: "Campo requerido: especifica el nombre del paciente", confidence: 100
- No hay dientes especificados → sugiere field: "teethNumbers", value: null, label: "Dientes a Trabajar", reason: "Campo requerido: indica qué dientes se trabajarán", confidence: 100
- No hay scanType pero menciona escaneo → sugiere field: "scanType", value: "DIGITAL_SCAN", label: "Tipo de Impresión", reason: "Mencionaste escaneo digital", confidence: 95
- scanType es DIGITAL_SCAN → sugiere field: "_fileUploadReminder", value: "Recuerda subir los archivos STL (Arcada Superior e Inferior) en la sección de Archivos", label: "Archivos STL Requeridos", reason: "Los archivos STL son obligatorios para escaneo digital", confidence: 100

PRIORIDAD 2 - Campos contextuales importantes:
- Usuario menciona "color A2" pero no especifica guía → sugiere field: "colorInfo.shadeType", value: "VITAPAN_CLASSICAL", label: "Guía de Color", reason: "El color A2 pertenece a la guía VITAPAN Classical", confidence: 90
- Usuario menciona "escáner intraoral" sin especificar marca → sugiere field: "escanerUtilizado", value: "iTero", label: "Escáner Utilizado", reason: "iTero es el escáner más común", confidence: 85
- Usuario especifica dientes sin tipo de trabajo → sugiere field: "tipoTrabajo", value: "restauracion", category: "tooth", toothNumber: "11", label: "Tipo de Trabajo", reason: "Restauración es el tipo más común", confidence: 85
- Usuario no especifica fecha de entrega → sugiere field: "fechaEntregaDeseada", value: "[fecha +7 días]", label: "Fecha de Entrega", reason: "Tiempo estándar para este tipo de trabajo", confidence: 80

PRIORIDAD 3 - Campos opcionales útiles:
- Usuario especifica "corona" sin material → sugiere field: "material", value: "Zirconia", category: "tooth", label: "Material", reason: "Zirconia es el material más común para coronas", confidence: 85

IMPORTANTE - Rutas de campos:
- Para campos a nivel orden: usa nombres simples como "escanerUtilizado", "fechaEntregaDeseada", "scanType"
- Para campos anidados en orden: usa rutas con puntos como "colorInfo.shadeType", "colorInfo.shadeCode", "oclusionDiseno.tipoOclusion"
- Para campos de diente: usa nombres simples o rutas como "material", "tipoTrabajo", "colorInfo.shadeType" con category: "tooth"
- Ejemplos de rutas válidas:
  * Order-level: "scanType", "escanerUtilizado", "colorInfo.shadeType", "oclusionDiseno.tipoOclusion"
  * Tooth-level: "material", "tipoTrabajo", "colorInfo.shadeType", "trabajoSobreImplante"

Ejemplos de cuándo NO sugerir:
- Usuario ya especificó el campo explícitamente
- No hay contexto suficiente para hacer una sugerencia informada
- Baja confianza (<80%)
- Sugerencia trivial o redundante
- El campo ya tiene valor en confirmedValues

FORMATO DE RESPUESTA FINAL:
Debes devolver un objeto JSON con DOS campos:
{
  "confirmedValues": {
    // Aquí va el JSON con los campos extraídos explícitamente del prompt (igual que antes)
  },
  "suggestions": [
    // Array de sugerencias (puede estar vacío si no hay sugerencias de alta confianza)
  ]
}

IMPORTANTE:
- Solo incluye sugerencias con confianza >= 80%
- Si no hay sugerencias de alta confianza, devuelve un array vacío en "suggestions"
- Los campos en "confirmedValues" NO deben repetirse en "suggestions"
- Para sugerencias de diente específico (category: "tooth"), SIEMPRE incluye "toothNumber"
- Para sugerencias a nivel orden (category: "order"), NO incluyas "toothNumber"`;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Get the AI prompt from request body
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key de Anthropic no configurada' }, { status: 500 });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Call Claude API with dental order extraction prompt
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: getDentalOrderExtractionPrompt(),
    });

    // Extract the text content from Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case Claude adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', responseText);
      return NextResponse.json(
        {
          error: 'Error al procesar la respuesta de la IA',
          details: responseText,
        },
        { status: 500 }
      );
    }

    // Extract confirmedValues and suggestions from the response
    const confirmedValues = parsedResponse.confirmedValues || parsedResponse;
    const suggestions = parsedResponse.suggestions || [];

    return NextResponse.json({
      success: true,
      data: {
        confirmedValues,
        suggestions,
      },
    });
  } catch (error) {
    console.error('Error in parse-ai-prompt:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar el prompt con IA',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
