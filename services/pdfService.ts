
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkOrder, WorkOrderStatus, Customer, Vehicle, WorkshopSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

// --- CONFIGURAÇÕES DE LAYOUT (A4 RÍGIDO) ---
const LAYOUT = {
  PAGE: {
    WIDTH: 210,  // mm
    HEIGHT: 297, // mm
    MARGIN_X: 15,
    MARGIN_Y: 15,
  },
  FONTS: {
    FAMILY: 'helvetica',
    SIZE: {
      TITLE: 16,
      SUBTITLE: 12,
      BODY: 10,     // Mínimo 10px conforme solicitado
      SMALL: 9,
      TINY: 8
    },
    LINE_HEIGHT: 1.2
  },
  COLORS: {
    PRIMARY: [15, 23, 42] as [number, number, number],   // Slate 900
    SECONDARY: [71, 85, 105] as [number, number, number], // Slate 600
    ACCENT: [2, 132, 199] as [number, number, number],    // Sky 600
    BORDER: [203, 213, 225] as [number, number, number],  // Slate 300
    BG_HEADER: [241, 245, 249] as [number, number, number], // Slate 100
    TEXT_MAIN: [30, 41, 59] as [number, number, number],  // Slate 800
  }
};

const CONTENT_WIDTH = LAYOUT.PAGE.WIDTH - (LAYOUT.PAGE.MARGIN_X * 2);

// --- UTILITÁRIOS ---

/**
 * Verifica se há espaço suficiente na página. Se não, cria nova página.
 */
const checkAndAddPage = (doc: jsPDF, currentY: number, requiredSpace: number) => {
  if (currentY + requiredSpace > LAYOUT.PAGE.HEIGHT - LAYOUT.PAGE.MARGIN_Y) {
    doc.addPage();
    return LAYOUT.PAGE.MARGIN_Y + 10; // Retorna novo Y inicial
  }
  return currentY;
};

/**
 * Escreve texto com quebra de linha segura (Word Wrap)
 */
const drawWrappedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, fontSize: number, fontStyle: string = 'normal', color: [number, number, number] = LAYOUT.COLORS.TEXT_MAIN) => {
  doc.setFont(LAYOUT.FONTS.FAMILY, fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  
  const lines = doc.splitTextToSize(text || '', maxWidth);
  doc.text(lines, x, y);
  
  // Retorna a altura ocupada pelo texto para ajustar o cursor Y
  const lineHeight = fontSize * 0.3527 * LAYOUT.FONTS.LINE_HEIGHT; // aprox mm
  return lines.length * lineHeight;
};

/**
 * Rodapé Padrão
 */
const drawFooter = (doc: jsPDF, pageNum: number, pageCount: number, settings: WorkshopSettings) => {
  const y = LAYOUT.PAGE.HEIGHT - 10;
  
  doc.setDrawColor(...LAYOUT.COLORS.BORDER);
  doc.setLineWidth(0.1);
  doc.line(LAYOUT.PAGE.MARGIN_X, y - 4, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, y - 4);
  
  doc.setFontSize(8);
  doc.setTextColor(...LAYOUT.COLORS.SECONDARY);
  
  const terms = settings.policyTerms ? settings.policyTerms.replace(/\n/g, ' ') : 'Sistema de Gestão OficinaPro';
  const text = doc.splitTextToSize(terms, 120);
  doc.text(text[0] + (text.length > 1 ? '...' : ''), LAYOUT.PAGE.MARGIN_X, y);
  
  doc.text(`Página ${pageNum} de ${pageCount}`, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, y, { align: 'right' });
};

/**
 * Cabeçalho Padrão
 */
const drawHeader = (doc: jsPDF, settings: WorkshopSettings, docTitle: string, docSubtitle: string) => {
  let y = LAYOUT.PAGE.MARGIN_Y;
  
  // 1. Logo
  const logoSize = 22;
  let infoStartX = LAYOUT.PAGE.MARGIN_X;
  
  if (settings.logo) {
    try {
      const props = doc.getImageProperties(settings.logo);
      const ratio = props.width / props.height;
      let w = logoSize * ratio;
      let h = logoSize;
      
      if (w > 50) { w = 50; h = w / ratio; }
      
      doc.addImage(settings.logo, props.fileType, LAYOUT.PAGE.MARGIN_X, y, w, h);
      infoStartX += w + 6;
    } catch (e) {
      // Fallback
      doc.setFillColor(...LAYOUT.COLORS.PRIMARY);
      doc.rect(LAYOUT.PAGE.MARGIN_X, y, logoSize, logoSize, 'F');
      infoStartX += logoSize + 6;
    }
  }

  // 2. Info da Empresa
  doc.setFont(LAYOUT.FONTS.FAMILY, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...LAYOUT.COLORS.PRIMARY);
  doc.text(settings.name.toUpperCase(), infoStartX, y + 5);

  doc.setFont(LAYOUT.FONTS.FAMILY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...LAYOUT.COLORS.SECONDARY);
  
  const address = [
    `${settings.address.street}, ${settings.address.number} - ${settings.address.neighborhood}`,
    `${settings.address.city} - ${settings.address.state}`,
    `Tel: ${settings.phone} ${settings.document ? `| CNPJ: ${settings.document}` : ''}`
  ];

  let addrY = y + 10;
  address.forEach(line => {
    doc.text(line, infoStartX, addrY);
    addrY += 4;
  });

  // 3. Título do Documento (Direita)
  doc.setFont(LAYOUT.FONTS.FAMILY, 'bold');
  doc.setFontSize(LAYOUT.FONTS.SIZE.TITLE);
  doc.setTextColor(...LAYOUT.COLORS.PRIMARY);
  doc.text(docTitle, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, y + 6, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...LAYOUT.COLORS.ACCENT);
  doc.text(docSubtitle, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, y + 12, { align: 'right' });

  // Linha divisória
  const bottomY = Math.max(y + logoSize, addrY) + 5;
  doc.setDrawColor(...LAYOUT.COLORS.PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(LAYOUT.PAGE.MARGIN_X, bottomY, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, bottomY);

  return bottomY + 8;
};

// =================================================================================
// GERADOR: ORDEM DE SERVIÇO / ORÇAMENTO
// =================================================================================
export const generateWorkOrderPDF = (
  order: WorkOrder,
  customer: Customer | null,
  vehicle: Vehicle | null,
  settings: WorkshopSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Título
  let docTitle = "ORDEM DE SERVIÇO";
  if (order.status === WorkOrderStatus.PENDING_QUOTE) docTitle = "ORÇAMENTO";
  if (order.status === WorkOrderStatus.FINISHED) docTitle = "RECIBO / GARANTIA";

  const subtitle = `Nº ${order.id.substring(0, 6).toUpperCase()} • ${formatDate(order.entryDate)}`;

  let y = drawHeader(doc, settings, docTitle, subtitle);

  // --- BLOCOS DE DADOS (Lado a Lado) ---
  const boxGap = 5;
  const boxWidth = (CONTENT_WIDTH - boxGap) / 2;
  const boxHeight = 35; // Altura fixa mínima para consistência

  // Função interna para desenhar caixa
  const drawInfoBox = (x: number, y: number, title: string, lines: string[]) => {
    // Header Box
    doc.setFillColor(...LAYOUT.COLORS.BG_HEADER);
    doc.rect(x, y, boxWidth, 7, 'F');
    doc.setDrawColor(...LAYOUT.COLORS.BORDER);
    doc.rect(x, y, boxWidth, boxHeight); // Borda externa

    // Título
    doc.setFont(LAYOUT.FONTS.FAMILY, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...LAYOUT.COLORS.SECONDARY);
    doc.text(title.toUpperCase(), x + 3, y + 4.5);

    // Conteúdo
    let contentY = y + 12;
    lines.forEach((line, idx) => {
      const isMain = idx === 0;
      const h = drawWrappedText(
        doc, 
        line, 
        x + 3, 
        contentY, 
        boxWidth - 6, 
        isMain ? 11 : 9, 
        isMain ? 'bold' : 'normal',
        isMain ? LAYOUT.COLORS.PRIMARY : LAYOUT.COLORS.TEXT_MAIN
      );
      contentY += h + 1; // Espaçamento entre linhas
    });
  };

  // Dados Cliente
  const clientInfo = customer 
    ? [customer.name, `CPF/CNPJ: ${customer.document}`, `Tel: ${customer.phone}`, customer.address]
    : ['Consumidor Final', '-', '-', '-'];
  
  drawInfoBox(LAYOUT.PAGE.MARGIN_X, y, "DADOS DO CLIENTE", clientInfo);

  // Dados Veículo
  const vehicleInfo = vehicle
    ? [`${vehicle.model} ${vehicle.brand}`, `Placa: ${vehicle.plate}`, `Ano: ${vehicle.year} • Cor: ${vehicle.color}`]
    : ['Veículo Não Identificado', '-', '-'];

  drawInfoBox(LAYOUT.PAGE.MARGIN_X + boxWidth + boxGap, y, "VEÍCULO", vehicleInfo);

  y += boxHeight + 8;

  // --- DESCRIÇÃO ---
  doc.setFont(LAYOUT.FONTS.FAMILY, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...LAYOUT.COLORS.PRIMARY);
  doc.text("RELATO / SOLICITAÇÃO:", LAYOUT.PAGE.MARGIN_X, y);
  y += 4;

  const descText = order.description || "Nenhuma observação registrada.";
  // Forçar quebra de texto longa
  const descHeight = drawWrappedText(doc, descText, LAYOUT.PAGE.MARGIN_X, y, CONTENT_WIDTH, 10, 'normal', LAYOUT.COLORS.TEXT_MAIN);
  
  y += descHeight + 8;

  // --- TABELA DE ITENS (Autotable com Largura Fixa) ---
  const tableData = order.services.map((s, i) => [
    (i + 1).toString(),
    s.description,
    formatCurrency(s.price).replace('R$', '').trim()
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'DESCRIÇÃO DOS SERVIÇOS E PEÇAS', 'VALOR (R$)']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: LAYOUT.FONTS.FAMILY,
      fontSize: 10,
      textColor: LAYOUT.COLORS.TEXT_MAIN,
      lineColor: LAYOUT.COLORS.BORDER,
      lineWidth: 0.1,
      cellPadding: 3,
      overflow: 'linebreak', // CRÍTICO: Permite quebra de texto
    },
    headStyles: {
      fillColor: LAYOUT.COLORS.PRIMARY,
      textColor: LAYOUT.COLORS.BG_HEADER,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // Index Fixo
      1: { cellWidth: 'auto' }, // Descrição Flexível (ocupa o resto)
      2: { cellWidth: 35, halign: 'right' }   // Valor Fixo
    },
    margin: { left: LAYOUT.PAGE.MARGIN_X, right: LAYOUT.PAGE.MARGIN_X },
    tableWidth: CONTENT_WIDTH, // Largura Exata A4
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;

  // --- TOTAIS (Verifica Paginação) ---
  const requiredHeightForTotals = 40;
  finalY = checkAndAddPage(doc, finalY, requiredHeightForTotals);

  const subtotal = order.services.reduce((a, b) => a + Number(b.price), 0);
  const total = Math.max(0, subtotal - (order.discount || 0));

  const drawTotalRow = (label: string, value: string, isBig: boolean = false) => {
    doc.setFontSize(isBig ? 12 : 10);
    doc.setFont(LAYOUT.FONTS.FAMILY, isBig ? 'bold' : 'normal');
    doc.setTextColor(isBig ? LAYOUT.COLORS.PRIMARY : LAYOUT.COLORS.SECONDARY);
    
    doc.text(label, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X - 45, finalY, { align: 'right' });
    doc.text(value, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, finalY, { align: 'right' });
    finalY += (isBig ? 8 : 6);
  };

  drawTotalRow("Subtotal:", formatCurrency(subtotal));
  if (order.discount > 0) {
    drawTotalRow("Desconto:", `- ${formatCurrency(order.discount)}`);
  }
  
  // Linha destaque total
  doc.setDrawColor(...LAYOUT.COLORS.BORDER);
  doc.line(LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X - 60, finalY - 2, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, finalY - 2);
  finalY += 2;
  
  drawTotalRow("TOTAL LÍQUIDO:", formatCurrency(total), true);

  // --- ASSINATURAS (Rodapé fixo ou após totais) ---
  let signY = LAYOUT.PAGE.HEIGHT - 40; // Tenta jogar pro final da página
  if (finalY > signY - 20) { // Se o conteúdo invadir a área de assinatura
    doc.addPage();
    signY = LAYOUT.PAGE.HEIGHT - 40;
  }

  const lineW = 70;
  doc.setDrawColor(...LAYOUT.COLORS.SECONDARY);
  doc.setLineWidth(0.2);

  // Assinatura 1
  doc.line(LAYOUT.PAGE.MARGIN_X, signY, LAYOUT.PAGE.MARGIN_X + lineW, signY);
  doc.setFontSize(8);
  doc.setTextColor(...LAYOUT.COLORS.SECONDARY);
  doc.text("RESPONSÁVEL TÉCNICO", LAYOUT.PAGE.MARGIN_X + (lineW/2), signY + 4, { align: 'center' });

  // Assinatura 2
  doc.line(LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X - lineW, signY, LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X, signY);
  doc.text("CLIENTE (DE ACORDO)", LAYOUT.PAGE.WIDTH - LAYOUT.PAGE.MARGIN_X - (lineW/2), signY + 4, { align: 'center' });

  // Paginação
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount, settings);
  }

  const safeName = customer?.name.substring(0, 15).replace(/[^a-z0-9]/gi, '_') || 'CLIENTE';
  doc.save(`OS_${order.id.substring(0, 4)}_${safeName}.pdf`);
};

// =================================================================================
// GERADOR: RELATÓRIO FINANCEIRO
// =================================================================================
export const generateFinancialReportPDF = (
  orders: WorkOrder[],
  startDate: string,
  endDate: string,
  settings: WorkshopSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const periodLabel = startDate && endDate 
    ? `${formatDate(startDate)} a ${formatDate(endDate)}` 
    : "Período Completo";
    
  let y = drawHeader(doc, settings, "RELATÓRIO FINANCEIRO", periodLabel);

  // --- KPI SUMMARY ---
  const totalRev = orders.reduce((acc, o) => acc + o.total, 0);
  const count = orders.length;
  const avg = count > 0 ? totalRev / count : 0;

  // Caixa de Resumo
  doc.setFillColor(...LAYOUT.COLORS.BG_HEADER);
  doc.rect(LAYOUT.PAGE.MARGIN_X, y, CONTENT_WIDTH, 18, 'F');
  doc.setDrawColor(...LAYOUT.COLORS.BORDER);
  doc.rect(LAYOUT.PAGE.MARGIN_X, y, CONTENT_WIDTH, 18);

  const colW = CONTENT_WIDTH / 3;
  
  const drawStat = (label: string, value: string, offsetX: number) => {
    doc.setFont(LAYOUT.FONTS.FAMILY, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...LAYOUT.COLORS.SECONDARY);
    doc.text(label.toUpperCase(), LAYOUT.PAGE.MARGIN_X + offsetX + 5, y + 6);
    
    doc.setFontSize(12);
    doc.setTextColor(...LAYOUT.COLORS.PRIMARY);
    doc.text(value, LAYOUT.PAGE.MARGIN_X + offsetX + 5, y + 14);
  };

  drawStat("Faturamento Total", formatCurrency(totalRev), 0);
  drawStat("Quantidade de Serviços", count.toString(), colW);
  drawStat("Ticket Médio", formatCurrency(avg), colW * 2);

  y += 25;

  // --- TABELA DETALHADA ---
  const tableData = orders.map(o => [
    formatDate(o.exitDate || o.entryDate),
    `#${o.id.substring(0, 6).toUpperCase()}`,
    // Simulação de nome se não tiver join (ideal seria passar o objeto populado)
    o.customerId ? `Cliente ID: ${o.customerId.substring(0,8)}` : 'Não Identificado', 
    formatCurrency(o.total)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['DATA', 'OS', 'CLIENTE / REF', 'VALOR']],
    body: tableData,
    theme: 'striped',
    styles: {
      font: LAYOUT.FONTS.FAMILY,
      fontSize: 9,
      cellPadding: 3,
      textColor: LAYOUT.COLORS.TEXT_MAIN
    },
    headStyles: {
      fillColor: LAYOUT.COLORS.PRIMARY,
      textColor: LAYOUT.COLORS.BG_HEADER,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25, fontStyle: 'bold' },
      2: { cellWidth: 'auto' }, // Wrap Text
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: LAYOUT.PAGE.MARGIN_X, right: LAYOUT.PAGE.MARGIN_X },
    tableWidth: CONTENT_WIDTH
  });

  // Paginação
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, i, pageCount, settings);
  }

  doc.save(`FINANCEIRO_${new Date().toISOString().split('T')[0]}.pdf`);
};
