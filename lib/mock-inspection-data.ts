/**
 * SURVEY - Dados Mockados Locais
 * Simulação de vistorias, checklists, fotos e templates para protótipo operacional
 */

import { Inspection, InspectionTemplate, MockPhoto } from './inspection-types';

// Helper para gerar SVGs inline elegantes para simular fotos de vistoria sem depender de serviços externos
export const createMockPhotoDataUrl = (label: string, bgGradient: string, iconType: string = 'car'): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          ${bgGradient}
        </linearGradient>
      </defs>
      <rect width="600" height="450" fill="url(#grad)" rx="8" />
      <rect x="20" y="20" width="560" height="410" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" rx="6" stroke-dasharray="6,6" />
      <circle cx="300" cy="200" r="48" fill="rgba(255,255,255,0.12)" />
      <path d="M280 200h40M300 180v40" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      <text x="300" y="280" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="20" font-weight="600" text-anchor="middle" letter-spacing="0.5">${label}</text>
      <text x="300" y="310" fill="rgba(255,255,255,0.7)" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" text-anchor="middle">SURVEY • REGISTRO OPERACIONAL</text>
      <rect x="440" y="390" width="130" height="24" rx="4" fill="rgba(0,0,0,0.4)" />
      <text x="505" y="406" fill="#f8fafc" font-family="monospace" font-size="11" text-anchor="middle">FOTO VERIFICADA</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

export const MOCK_PHOTOS_GALLERY: Record<string, MockPhoto> = {
  pneus: {
    id: 'p-1',
    url: createMockPhotoDataUrl('PNEUS DIANTEIROS E TRASEIROS', '<stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>'),
    caption: 'Verificação do sulco e TWI dos 4 pneus',
    timestamp: '14:32 - 10/09/2026',
    isPlaceholder: true,
  },
  farois: {
    id: 'p-2',
    url: createMockPhotoDataUrl('CONJUNTO ÓPTICO E FARÓIS', '<stop offset="0%" stop-color="#0369a1"/><stop offset="100%" stop-color="#0c4a6e"/>'),
    caption: 'Faróis dianteiros em perfeito estado sem trincas',
    timestamp: '14:35 - 10/09/2026',
    isPlaceholder: true,
  },
  lataria: {
    id: 'p-3',
    url: createMockPhotoDataUrl('LATARIA LATERAL DIREITA', '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#1e293b"/>'),
    caption: 'Pequeno risco superficial próximo à porta traseira',
    timestamp: '14:38 - 10/09/2026',
    isPlaceholder: true,
  },
  interior: {
    id: 'p-4',
    url: createMockPhotoDataUrl('INTERIOR E ESTOFAMENTO', '<stop offset="0%" stop-color="#0f766e"/><stop offset="100%" stop-color="#134e4a"/>'),
    caption: 'Bancos e painel higienizados',
    timestamp: '14:40 - 10/09/2026',
    isPlaceholder: true,
  },
  motor: {
    id: 'p-5',
    url: createMockPhotoDataUrl('COMPARTIMENTO DO MOTOR', '<stop offset="0%" stop-color="#475569"/><stop offset="100%" stop-color="#1e293b"/>'),
    caption: 'Sem vazamentos aparentes de óleo ou arrefecimento',
    timestamp: '14:43 - 10/09/2026',
    isPlaceholder: true,
  },
};

// Templates pré-configurados
export const MOCK_TEMPLATES: InspectionTemplate[] = [
  {
    id: 'tpl-rapida',
    name: 'Vistoria Rápida',
    description: 'Checklist express para conferência ágil de entrada e saída rápida no pátio.',
    stepsCount: 4,
    estimatedMinutes: 5,
    category: 'Geral',
    iconName: 'Zap',
    steps: [
      {
        id: 'step-r-1',
        title: 'Quilometragem & Combustível',
        description: 'Registrar odômetro e nível atual do tanque',
        required: true,
        requiresPhoto: true,
        responseType: 'TEXT',
        placeholder: 'Ex: 45.280 km - 3/4 Tanque',
      },
      {
        id: 'step-r-2',
        title: 'Estado Geral da Lataria',
        description: 'Avaliar existência de riscos ou amassados visíveis',
        required: true,
        requiresPhoto: true,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-r-3',
        title: 'Pneus e Rodas',
        description: 'Conferência visual dos 4 pneus e estepe',
        required: true,
        requiresPhoto: false,
        responseType: 'SINGLE_CHOICE',
        options: ['Perfeito estado', 'Desgaste moderado', 'Necessita troca'],
      },
      {
        id: 'step-r-4',
        title: 'Pertences no Veículo',
        description: 'Conferir se há objetos pessoais deixados no carro',
        required: true,
        requiresPhoto: false,
        responseType: 'BOOLEAN',
      },
    ],
  },
  {
    id: 'tpl-completa',
    name: 'Vistoria Completa',
    description: 'Inspeção minuciosa de ponta a ponta com registro fotográfico e checklist detalhado.',
    stepsCount: 7,
    estimatedMinutes: 15,
    category: 'Padrão B2B',
    iconName: 'ShieldCheck',
    steps: [
      {
        id: 'step-1',
        title: 'Pneus',
        description: 'Condição da banda de rodagem, marcas e calibragem dos 4 pneus.',
        required: true,
        requiresPhoto: true,
        responseType: 'SINGLE_CHOICE',
        options: ['Novos / Pouco uso', 'Meia vida (seguro)', 'Atenção (próximo do TWI)', 'Troca imediata'],
      },
      {
        id: 'step-2',
        title: 'Faróis',
        description: 'Verificação dos faróis alto/baixo, lanternas e setas dianteiras/traseiras.',
        required: true,
        requiresPhoto: true,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-3',
        title: 'Lataria',
        description: 'Avaliação de pintura, riscos, mossas, amassados ou peças desalinhadas.',
        required: true,
        requiresPhoto: true,
        responseType: 'MULTIPLE_CHOICE',
        options: ['Sem avarias visíveis', 'Riscos superficiais', 'Pequeno amassado', 'Repintura identificada', 'Batida estrutural'],
      },
      {
        id: 'step-4',
        title: 'Interior',
        description: 'Higienização dos bancos, teto, painel, cintos de segurança e carpete.',
        required: true,
        requiresPhoto: true,
        responseType: 'SINGLE_CHOICE',
        options: ['Higienizado / Sem avarias', 'Uso moderado / Poeira normal', 'Manchas no estofado', 'Rasgos ou queimaduras'],
      },
      {
        id: 'step-5',
        title: 'Motor',
        description: 'Ruídos anormais, nível de fluidos e inspeção visual de vazamentos.',
        required: true,
        requiresPhoto: false,
        responseType: 'TEXT',
        placeholder: 'Descreva condições do motor, nível do óleo e arrefecimento...',
      },
      {
        id: 'step-6',
        title: 'Documentos',
        description: 'Presença do CRLV no porta-luvas e conformidade de placa e lacre.',
        required: true,
        requiresPhoto: false,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-7',
        title: 'Acessórios',
        description: 'Itens de segurança e ferramentas originais no porta-malas.',
        required: true,
        requiresPhoto: true,
        responseType: 'MULTIPLE_CHOICE',
        options: ['Chave reserva', 'Manual do proprietário', 'Estepe original', 'Macaco e chave de roda', 'Triângulo de segurança'],
      },
    ],
  },
  {
    id: 'tpl-locadora',
    name: 'Entrada de Locadora',
    description: 'Checklist rigoroso para devolução e checkout de frotas e locação.',
    stepsCount: 6,
    estimatedMinutes: 8,
    category: 'Locadoras',
    iconName: 'Car',
    steps: [
      {
        id: 'step-loc-1',
        title: 'Odômetro & Combustível',
        description: 'Registro exato para apuração de consumo e quilometragem contratada.',
        required: true,
        requiresPhoto: true,
        responseType: 'NUMBER',
        placeholder: 'Quilometragem atual',
        unit: 'km',
      },
      {
        id: 'step-loc-2',
        title: 'Lataria e Para-choques',
        description: 'Conferência de arranhões ou ralados de estacionamento.',
        required: true,
        requiresPhoto: true,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-loc-3',
        title: 'Pneus e Rodas',
        description: 'Verificação de bolhas, rasgos laterais ou rodas raspadas.',
        required: true,
        requiresPhoto: true,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-loc-4',
        title: 'Higienização Interna',
        description: 'Estado dos bancos e presença de odores ou sujeira pesada.',
        required: true,
        requiresPhoto: false,
        responseType: 'SINGLE_CHOICE',
        options: ['Limpo para novo cliente', 'Necessita lavagem simples', 'Necessita higienização pesada'],
      },
      {
        id: 'step-loc-5',
        title: 'Acessórios & Documentos',
        description: 'Tag de pedágio, manual, chave e documento digital.',
        required: true,
        requiresPhoto: false,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-loc-6',
        title: 'Estepe e Ferramentas',
        description: 'Conferência física no compartimento inferior do porta-malas.',
        required: true,
        requiresPhoto: true,
        responseType: 'BOOLEAN',
      },
    ],
  },
  {
    id: 'tpl-oficina',
    name: 'Oficina Mecânica',
    description: 'Recepção de veículo para orçamento, diagnóstico e resguardo de responsabilidade.',
    stepsCount: 6,
    estimatedMinutes: 10,
    category: 'Oficinas',
    iconName: 'Wrench',
    steps: [
      {
        id: 'step-of-1',
        title: 'Reclamação do Cliente / Entrada',
        description: 'Sintomas relatados e motivo da entrada na oficina.',
        required: true,
        requiresPhoto: false,
        responseType: 'TEXT',
        placeholder: 'Relato do cliente, barulhos, luzes acesas no painel...',
      },
      {
        id: 'step-of-2',
        title: 'Painel & Luzes de Alerta',
        description: 'Fotografia do painel com motor em marcha lenta e luzes indicadoras.',
        required: true,
        requiresPhoto: true,
        responseType: 'BOOLEAN',
      },
      {
        id: 'step-of-3',
        title: 'Nível de Óleo e Arrefecimento',
        description: 'Checagem prévia antes de ligar ou manobrar na rampa.',
        required: true,
        requiresPhoto: false,
        responseType: 'SINGLE_CHOICE',
        options: ['Níveis normais', 'Óleo baixo', 'Arrefecimento baixo', 'Vazamento evidente'],
      },
      {
        id: 'step-of-4',
        title: 'Avarias Prévias na Lataria',
        description: 'Registro de batidas já existentes para evitar contestações futuras.',
        required: true,
        requiresPhoto: true,
        responseType: 'MULTIPLE_CHOICE',
        options: ['Sem avarias', 'Risco no para-choque', 'Amassado na porta', 'Farol trincado', 'Retrovisor danificado'],
      },
      {
        id: 'step-of-5',
        title: 'Combustível na Entrada',
        description: 'Marcador de combustível registrado na recepção.',
        required: true,
        requiresPhoto: false,
        responseType: 'SINGLE_CHOICE',
        options: ['Reserva', '1/4', '1/2', '3/4', 'Cheio'],
      },
      {
        id: 'step-of-6',
        title: 'Objetos e Pertences no Porta-malas',
        description: 'Conferência de som, caixas, pertences e ferramentas.',
        required: true,
        requiresPhoto: false,
        responseType: 'BOOLEAN',
      },
    ],
  },
];

// Vistoria inicial em andamento para demonstração imediata
export const INITIAL_INSPECTION_MOCK: Inspection = {
  id: 'insp_78942',
  vehicle: {
    plate: 'BRA2E19',
    model: 'Civic EXL 2.0 Flex Aut.',
    brand: 'Honda',
    year: 2022,
    color: 'Prata Platinum',
    chassis: '93HFC2630NZ109842',
    mileage: 38450,
    customerName: 'Localiza Gestão de Frotas',
    companyName: 'Autosul Logística e Vistorias Ltda.',
  },
  templateId: 'tpl-completa',
  templateName: 'Vistoria Completa',
  status: 'IN_PROGRESS',
  startedAt: '10/09/2026 às 14:30',
  operatorName: 'Marcos Silveira (Operador Sênior)',
  stepStatuses: {
    'step-1': 'COMPLETED',
    'step-2': 'COMPLETED',
    'step-3': 'PENDING',
    'step-4': 'PENDING',
    'step-5': 'PENDING',
    'step-6': 'PENDING',
    'step-7': 'PENDING',
  },
  responses: {
    'step-1': {
      stepId: 'step-1',
      value: 'Novos / Pouco uso',
      notes: 'Pneus dianteiros e traseiros originais Michelin, banda de rodagem com mais de 6mm.',
      photos: [MOCK_PHOTOS_GALLERY.pneus],
      completedAt: '14:34',
    },
    'step-2': {
      stepId: 'step-2',
      value: true,
      notes: 'Lâmpadas de LED funcionando perfeitamente, sem trincas nas lentes.',
      photos: [MOCK_PHOTOS_GALLERY.farois],
      completedAt: '14:36',
    },
    'step-3': {
      stepId: 'step-3',
      value: ['Riscos superficiais'],
      notes: 'Risco superficial de aproximadamente 5cm no para-choque traseiro direito.',
      photos: [MOCK_PHOTOS_GALLERY.lataria],
    },
    'step-4': {
      stepId: 'step-4',
      value: 'Higienizado / Sem avarias',
      notes: 'Estofamento sem manchas, ar-condicionado operando.',
      photos: [],
    },
    'step-5': {
      stepId: 'step-5',
      value: 'Níveis de óleo e líquido de arrefecimento conferidos e normais. Sem vazamentos.',
      notes: 'Bateria Moura em bom estado.',
      photos: [],
    },
    'step-6': {
      stepId: 'step-6',
      value: true,
      notes: 'CRLV digital validado no sistema.',
      photos: [],
    },
    'step-7': {
      stepId: 'step-7',
      value: ['Chave reserva', 'Manual do proprietário', 'Estepe original', 'Macaco e chave de roda', 'Triângulo de segurança'],
      notes: 'Todos os 5 itens conferidos e presentes no porta-malas.',
      photos: [],
    },
  },
};
