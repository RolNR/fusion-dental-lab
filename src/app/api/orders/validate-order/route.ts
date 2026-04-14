import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Anthropic } from '@posthog/ai';
import { getPostHogClient } from '@/lib/posthog-server';

// AI Configuration
const AI_MODEL = 'claude-sonnet-4-20250514';
const AI_MAX_TOKENS = 1024;

// Types for validation alerts
export interface ValidationAlert {
  id: string;
  type: 'blocking' | 'warning' | 'suggestion';
  message: string;
  field?: string;
  action?: string;
}

export interface ValidationResponse {
  isValid: boolean;
  alerts: ValidationAlert[];
}

/**
 * System prompt for validating dental orders as an expert prosthodontist
 */
function getValidationSystemPrompt(): string {
  return `Eres un dentista experto en restauraciones protésicas que revisa órdenes de laboratorio dental.
Tu objetivo es detectar problemas REALES que causarían confusión al laboratorio o errores clínicos.

IMPORTANTE: Solo reporta problemas CONCRETOS y ACCIONABLES. NO seas excesivamente estricto.

Analiza la orden y devuelve un JSON con alertas en 3 categorías:

1. "blocking" (🔴): SOLO problemas que hacen IMPOSIBLE procesar la orden
   - Archivos de escaneo faltantes cuando isDigitalScan=true (falta superior O inferior)
   - Contradicciones graves que hacen imposible entender qué se pide
   - NUNCA bloquees por información que el laboratorio puede inferir

2. "warning" (🟡): Problemas que requieren atención pero NO bloquean
   - Inconsistencias CLARAS entre campos y notas (ej: campos dicen "corona" pero notas dicen "quiero carilla")
   - Combinaciones material/restauración con limitaciones conocidas (ver abajo)
   - Información de implante faltante cuando trabajoSobreImplante=true

3. "suggestion" (🟢): Mejoras opcionales
   - Campos que mejorarían la orden pero no son críticos
   - Información adicional útil para el laboratorio

REGLAS CRÍTICAS - MUY IMPORTANTE:
- NO reportes si la orden está correcta - devuelve alerts: []
- Sé MUY CONSERVADOR: máximo 3-4 alertas, solo las más importantes
- NO bloquees por cosas que el laboratorio sabe inferir (pilares, pónticos, etc.)
- Si tipoCaso es "garantia", no requieras configuración de dientes

COSAS QUE NO DEBES REPORTAR COMO PROBLEMAS:
- Puentes sin especificar pilares/pónticos (el lab sabe que los dientes al lado del ausente son pilares)
- Falta de información sobre antagonista (es opcional)
- Campos opcionales vacíos
- Material genérico sin especificar marca exacta

COMBINACIONES MATERIAL/RESTAURACIÓN - SOLO ADVERTENCIAS (warning), NUNCA blocking:
- E-max/Disilicato de litio en puentes de más de 3 unidades → warning "E-max tiene limitaciones en puentes largos, considerar zirconia"
- E-max en zona posterior (molares) para puentes → warning "E-max en molares posteriores tiene mayor riesgo de fractura"
- Zirconia monolítica para carillas anteriores → warning "Zirconia monolítica puede tener limitaciones estéticas para carillas"
- Metal-porcelana cuando hay poco espacio oclusal → warning solo si se menciona espacio reducido

VALIDACIONES DE ESCANEO DIGITAL (isDigitalScan=true):
- Si falta archivo de arcada superior Y el trabajo incluye dientes superiores → blocking
- Si falta archivo de arcada inferior Y el trabajo incluye dientes inferiores → blocking
- Si faltan ambos archivos → blocking

INCONSISTENCIAS NOTAS vs CAMPOS:
- SOLO reporta si hay contradicción DIRECTA y CLARA
- Ejemplo de contradicción clara: campos dicen "corona" pero notas dicen "quiero una carilla"
- NO reportes si las notas solo añaden detalle sin contradecir

FORMATO DE RESPUESTA (SOLO JSON, nada más):
{
  "alerts": [
    {
      "id": "unique-id-1",
      "type": "blocking" | "warning" | "suggestion",
      "message": "Mensaje conciso (máx 20 palabras)",
      "field": "nombre del campo (opcional)",
      "action": "Qué hacer (opcional)"
    }
  ]
}

Si la orden está correcta o solo tiene detalles menores, devuelve: { "alerts": [] }`;
}

/**
 * Format order data for AI analysis
 */
function formatOrderDataForValidation(data: Record<string, unknown>): string {
  const sections: string[] = [];

  // Basic info
  sections.push('=== INFORMACIÓN BÁSICA ===');
  sections.push(`Paciente: ${data.patientName || '(no especificado)'}`);
  sections.push(`Tipo de caso: ${data.tipoCaso || 'nuevo'}`);
  if (data.tipoCaso === 'garantia') {
    sections.push(`Motivo garantía: ${data.motivoGarantia || '(no especificado)'}`);
  }
  sections.push(`Fecha entrega deseada: ${data.fechaEntregaDeseada || '(no especificada)'}`);
  sections.push(`Orden urgente: ${data.isUrgent ? 'Sí' : 'No'}`);

  // Digital scan
  sections.push('\n=== ESCANEO DIGITAL ===');
  sections.push(`Es escaneo digital: ${data.isDigitalScan ? 'Sí' : 'No'}`);
  if (data.isDigitalScan) {
    sections.push(`Escáner utilizado: ${data.escanerUtilizado || '(no especificado)'}`);
    sections.push(`Tiene archivo arcada superior: ${data.hasUpperFile ? 'Sí' : 'No'}`);
    sections.push(`Tiene archivo arcada inferior: ${data.hasLowerFile ? 'Sí' : 'No'}`);
    sections.push(`Tiene archivo de mordida: ${data.hasBiteFile ? 'Sí' : 'No'}`);
  }

  // Initial tooth states (ausentes, pilares, implantes)
  const initialStates = data.initialToothStates as Record<string, string> | undefined;
  if (initialStates && Object.keys(initialStates).length > 0) {
    sections.push('\n=== ESTADO INICIAL DE DIENTES ===');
    const ausentes: string[] = [];
    const pilares: string[] = [];
    const implantes: string[] = [];

    Object.entries(initialStates).forEach(([tooth, state]) => {
      if (state === 'AUSENTE') ausentes.push(tooth);
      else if (state === 'PILAR') pilares.push(tooth);
      else if (state === 'IMPLANTE') implantes.push(tooth);
    });

    if (ausentes.length > 0) sections.push(`Dientes AUSENTES: ${ausentes.join(', ')}`);
    if (pilares.length > 0) sections.push(`Dientes marcados como PILAR: ${pilares.join(', ')}`);
    if (implantes.length > 0) sections.push(`Dientes con IMPLANTE: ${implantes.join(', ')}`);
  }

  // Teeth configuration
  const teeth = data.teeth as Array<Record<string, unknown>> | undefined;
  if (teeth && teeth.length > 0) {
    sections.push('\n=== CONFIGURACIÓN DE DIENTES ===');
    sections.push(`Total de dientes en la orden: ${teeth.length}`);

    // Group by restoration type for better analysis
    const puentes = teeth.filter((t) => t.tipoRestauracion === 'puente');
    const coronas = teeth.filter((t) => t.tipoRestauracion === 'corona');
    const carillas = teeth.filter((t) => t.tipoRestauracion === 'carilla');
    const otros = teeth.filter(
      (t) => !['puente', 'corona', 'carilla'].includes(t.tipoRestauracion as string)
    );

    if (puentes.length > 0) {
      sections.push(`\n--- PUENTES (${puentes.length} dientes) ---`);
      const materiales = [...new Set(puentes.map((t) => t.material))];
      sections.push(`Materiales: ${materiales.join(', ') || '(no especificado)'}`);
      sections.push(`Dientes: ${puentes.map((t) => t.toothNumber).join(', ')}`);
      // Calculate span
      const toothNums = puentes
        .map((t) => parseInt(t.toothNumber as string, 10))
        .sort((a, b) => a - b);
      if (toothNums.length >= 2) {
        sections.push(`Extensión del puente: ${toothNums.length} unidades`);
      }
    }

    if (coronas.length > 0) {
      sections.push(`\n--- CORONAS (${coronas.length}) ---`);
      coronas.forEach((tooth) => {
        sections.push(`Diente ${tooth.toothNumber}: ${tooth.material || '(sin material)'}`);
      });
    }

    if (carillas.length > 0) {
      sections.push(`\n--- CARILLAS (${carillas.length}) ---`);
      carillas.forEach((tooth) => {
        sections.push(`Diente ${tooth.toothNumber}: ${tooth.material || '(sin material)'}`);
      });
    }

    if (otros.length > 0) {
      sections.push(`\n--- OTRAS RESTAURACIONES (${otros.length}) ---`);
      otros.forEach((tooth) => {
        sections.push(
          `Diente ${tooth.toothNumber}: ${tooth.tipoRestauracion || '(sin tipo)'} - ${tooth.material || '(sin material)'}`
        );
      });
    }

    // Check for implant work
    const implantWork = teeth.filter((t) => t.trabajoSobreImplante);
    if (implantWork.length > 0) {
      sections.push(`\n--- TRABAJO SOBRE IMPLANTES (${implantWork.length}) ---`);
      implantWork.forEach((tooth) => {
        const implantInfo = tooth.informacionImplante as Record<string, unknown> | undefined;
        sections.push(`Diente ${tooth.toothNumber}:`);
        sections.push(`  - Marca: ${implantInfo?.marcaImplante || '(no especificada)'}`);
        sections.push(`  - Conexión: ${implantInfo?.sistemaConexion || '(no especificado)'}`);
        sections.push(`  - Scanbody: ${implantInfo?.scanbody || '(no especificado)'}`);
        sections.push(`  - Tipo aditamento: ${implantInfo?.tipoAditamento || '(no especificado)'}`);
        sections.push(
          `  - Perfil emergencia: ${implantInfo?.perfilEmergencia || '(no especificado)'}`
        );
        sections.push(
          `  - Tipo restauración: ${implantInfo?.tipoRestauracion || '(no especificado)'}`
        );
      });
    }
  } else if (data.tipoCaso !== 'garantia') {
    sections.push('\n=== CONFIGURACIÓN DE DIENTES ===');
    sections.push('No hay dientes configurados');
  }

  // Submission type
  sections.push('\n=== TIPO DE ENVÍO ===');
  sections.push(`Tipo de envío: ${data.submissionType || '(no especificado)'}`);
  sections.push(`Articulado por: ${data.articulatedBy || '(no especificado)'}`);

  // Notes (important for detecting inconsistencies)
  if (data.notes) {
    sections.push('\n=== NOTAS ADICIONALES ===');
    sections.push(data.notes as string);
  }

  // AI Prompt (original description)
  if (data.aiPrompt) {
    sections.push('\n=== DESCRIPCIÓN ORIGINAL (AI Prompt) ===');
    sections.push(data.aiPrompt as string);
  }

  return sections.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Get order data from request body
    const orderData = await request.json();

    if (!orderData || typeof orderData !== 'object') {
      return NextResponse.json({ error: 'Datos de orden requeridos' }, { status: 400 });
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key de Anthropic no configurada' }, { status: 500 });
    }

    // Format order data for AI analysis
    const formattedData = formatOrderDataForValidation(orderData);

    // Initialize Anthropic client wrapped with PostHog LLM analytics
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      posthog: getPostHogClient(),
    });

    // Call Claude API for validation
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: `Analiza esta orden de laboratorio dental y reporta problemas:\n\n${formattedData}`,
        },
      ],
      system: getValidationSystemPrompt(),
      posthogDistinctId: session.user.id,
      posthogProperties: {
        feature: 'ai_order_validation',
      },
    });

    // Extract the text content from Claude's response (non-streaming response)
    if (!('content' in message)) {
      throw new Error('Unexpected streaming response from Anthropic API');
    }
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response
    let parsedResponse: { alerts: ValidationAlert[] };
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Error parsing validation response:', responseText);
      // Return empty alerts if parsing fails (don't block the user)
      parsedResponse = { alerts: [] };
    }

    // Ensure alerts array exists
    const alerts = parsedResponse.alerts || [];

    // Check if there are any blocking alerts
    const hasBlockingAlerts = alerts.some((alert) => alert.type === 'blocking');

    return NextResponse.json({
      success: true,
      data: {
        isValid: !hasBlockingAlerts,
        alerts,
      } as ValidationResponse,
    });
  } catch (error) {
    console.error('Error in validate-order:', error);
    // Don't block the user if validation fails
    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        alerts: [],
      } as ValidationResponse,
    });
  }
}
