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
Tu tarea es analizar el texto en lenguaje natural y extraer la información estructurada de una orden dental.

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

  "tipoTrabajo": "restauracion" u "otro",
  "tipoRestauracion": "corona", "puente", "inlay", "onlay", "carilla", o "provisional",

  "scanType": "DIGITAL_SCAN" o "ANALOG_MOLD",
  "escanerUtilizado": "iTero", "Medit", "ThreeShape", "Carestream", u "Otro",
  "otroEscaner": "Nombre del escáner si es 'Otro'",
  "tipoSilicon": "adicion" o "condensacion" (solo para moldes análogos),
  "notaModeloFisico": "Observaciones sobre el modelo físico (solo para moldes análogos)",

  "material": "Material como Zirconia, Porcelana, Disilicato de litio, etc",
  "materialBrand": "Marca del material como IPS e.max, Katana, Prettau",
  "color": "Código de color como A2, B1, etc",

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

  "submissionType": "prueba_estructura", "prueba_estetica", o "terminado",
  "articulatedBy": "doctor" o "laboratorio",

  "oclusionDiseno": {
    "tipoOclusion": SOLO usa uno de estos valores exactos: "normal", "clase_i", "clase_ii", "clase_iii", "borde_a_borde", "mordida_cruzada",
    "espacioInteroclusalSuficiente": true o false,
    "solucionEspacioInsuficiente": "reduccion_oclusal", "aumento_vertical", o "ambas" (opcional)
  },

  "colorInfo": {
    "shadeType": "Tipo de guía de color - puede ser null",
    "shadeCode": "Código de color - puede ser null",
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

Reglas CRÍTICAS:
- SOLO incluye en el JSON los campos para los que encuentres información EXPLÍCITA en el prompt
- NO incluyas campos con valores null, undefined, o vacíos
- Si no encuentras información para un campo, NO lo incluyas en el JSON de respuesta
- Las fechas deben estar en formato YYYY-MM-DD
- Para fechas relativas (ej: "en 5 días"), calcula la fecha desde hoy (${today})
- Los números de dientes deben estar en notación FDI (11-48) o Universal (1-32)

IMPORTANTE - Formato de valores:
- Para "tipoOclusion": USA SOLO los valores EXACTOS permitidos. Si mencionan "mordida profunda", mapea a "mordida_cruzada" o "clase_ii" según el contexto.
- Para "texture" y "gloss": SIEMPRE devuelve un ARRAY, aunque sea de un solo elemento: ["lisa"] NO "lisa"
- Para "translucency": SIEMPRE incluye "description" aunque sea genérica como "translucidez media"
- Para enums de implantes: usa EXACTAMENTE los valores especificados en minúsculas con guiones bajos

- Sé preciso y conservador - si no estás 100% seguro de un valor enum, omite ese campo
- Devuelve SOLO el JSON con los campos que pudiste extraer con certeza
- NO inventes información - solo extrae lo que está explícitamente mencionado`;
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
    let parsedData;
    try {
      // Try to extract JSON from the response (in case Claude adds extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(responseText);
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

    return NextResponse.json({
      success: true,
      data: parsedData,
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
