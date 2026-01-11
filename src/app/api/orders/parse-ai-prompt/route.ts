import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

// AI Configuration
const AI_MODEL = 'claude-sonnet-4-20250514';
const AI_MAX_TOKENS = 1024;

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
  "patientName": "Nombre del paciente",
  "fechaEntregaDeseada": "Fecha en formato YYYY-MM-DD",
  "teethNumbers": "Números de dientes separados por coma",
  "tipoCaso": "nuevo" o "garantia",
  "tipoTrabajo": "restauracion" u "otro",
  "tipoRestauracion": "corona", "puente", "inlay", "onlay", "carilla", o "provisional",
  "scanType": "DIGITAL_SCAN" o "ANALOG_MOLD",
  "escanerUtilizado": "iTero", "Medit", "ThreeShape", "Carestream", u "Otro",
  "otroEscaner": "Nombre del escáner si es 'Otro'",
  "tipoSilicon": "adicion" o "condensacion",
  "material": "Material como Zirconia, Porcelana, etc",
  "materialBrand": "Marca del material como IPS e.max",
  "color": "Código de color como A2, B1",
  "trabajoSobreImplante": true o false,
  "submissionType": "prueba_estructura", "prueba_estetica", o "terminado",
  "articulatedBy": "doctor" o "laboratorio",
  "notes": "Cualquier nota adicional extraída"
}

Reglas CRÍTICAS:
- SOLO incluye en el JSON los campos para los que encuentres información EXPLÍCITA en el prompt
- NO incluyas campos con valores null, undefined, o vacíos
- Si no encuentras información para un campo, NO lo incluyas en el JSON de respuesta
- Las fechas deben estar en formato YYYY-MM-DD
- Para fechas relativas (ej: "en 5 días"), calcula la fecha desde hoy (${today})
- Sé preciso y conservador - si no estás 100% seguro, omite el campo
- Devuelve SOLO el JSON con los campos que pudiste extraer con certeza`;
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
