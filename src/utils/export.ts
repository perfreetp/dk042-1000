import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import type { CarbonAsset, Transaction, ReductionProject, MonthlyReport, PerformanceReport } from '@/types';
import {
  getAssetTypeLabel,
  getAssetStatusLabel,
  getAssetSourceLabel,
  getTransactionTypeLabel,
  getTransactionStatusLabel,
  getProjectStatusLabel,
  formatDate,
  formatNumber,
  formatCurrency,
  formatCarbon,
} from './format';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME_TYPE = 'application/pdf';

const downloadFile = (data: BlobPart, filename: string, mimeType: string): void => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportAssetsToExcel = (assets: CarbonAsset[], filename?: string): void => {
  const data = assets.map((asset) => ({
    '资产编号': asset.id,
    '资产类型': getAssetTypeLabel(asset.type),
    '资产名称': asset.name,
    '数量(吨CO2e)': asset.amount,
    '来源': getAssetSourceLabel(asset.source),
    '状态': getAssetStatusLabel(asset.status),
    '年度': asset.year,
    '所属部门': asset.department,
    '成本(元)': asset.cost,
    '获取日期': formatDate(asset.acquiredDate),
    '到期日期': asset.expiryDate ? formatDate(asset.expiryDate) : '-',
    '备注': asset.description || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '碳资产台账');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(excelBuffer, filename || `碳资产台账_${formatDate(new Date())}.xlsx`, EXCEL_MIME_TYPE);
};

export const exportTransactionsToExcel = (transactions: Transaction[], filename?: string): void => {
  const data = transactions.map((t) => ({
    '交易编号': t.id,
    '交易类型': getTransactionTypeLabel(t.type),
    '资产名称': t.assetName,
    '资产类型': getAssetTypeLabel(t.assetType),
    '数量(吨CO2e)': t.amount,
    '单价(元/吨)': t.unitPrice || '-',
    '总金额(元)': t.totalAmount || '-',
    '交易对手': t.counterparty || '-',
    '所属部门': t.department,
    '状态': getTransactionStatusLabel(t.status),
    '交易日期': formatDate(t.transactionDate),
    '操作员': t.operator,
    '备注': t.remark || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(excelBuffer, filename || `交易记录_${formatDate(new Date())}.xlsx`, EXCEL_MIME_TYPE);
};

export const exportProjectsToExcel = (projects: ReductionProject[], filename?: string): void => {
  const data = projects.map((p) => ({
    '项目编号': p.code,
    '项目名称': p.name,
    '项目类型': p.type,
    '所属部门': p.department,
    '负责人': p.manager,
    '状态': getProjectStatusLabel(p.status),
    '开始日期': formatDate(p.startDate),
    '结束日期': formatDate(p.endDate),
    '总投资(元)': p.totalInvestment,
    '预计减排量(吨)': p.estimatedReduction,
    '实际减排量(吨)': p.actualReduction,
    '预计收益(元)': p.estimatedRevenue,
    '实际收益(元)': p.actualRevenue,
    '进度(%)': p.progress,
    '描述': p.description || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '减排项目');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(excelBuffer, filename || `减排项目_${formatDate(new Date())}.xlsx`, EXCEL_MIME_TYPE);
};

export const exportMonthlyReportToExcel = (
  report: Array<{
    month: string;
    monthLabel: string;
    department: string;
    departmentName: string;
    openingBalance: number;
    currentAdd: number;
    currentReduce: number;
    closingBalance: number;
    closingCost: number;
    cost: number;
    revenue: number;
    profit: number;
  }>,
  filename?: string
): void => {
  const data = report.map((r) => ({
    '月份': r.monthLabel,
    '部门': r.departmentName,
    '期初余额(吨)': r.openingBalance,
    '本期增加(吨)': r.currentAdd,
    '本期减少(吨)': r.currentReduce,
    '期末余额(吨)': r.closingBalance,
    '增加成本(元)': r.cost,
    '卖出收益(元)': r.revenue,
    '销售利润(元)': r.profit,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '月度盘点表');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(excelBuffer, filename || `月度盘点表_${formatDate(new Date())}.xlsx`, EXCEL_MIME_TYPE);
};

export const exportPerformanceReportToExcel = (report: PerformanceReport[], filename?: string): void => {
  const data = report.map((r) => ({
    '年度': r.year,
    '部门': r.department,
    '排放目标(吨)': r.emissionTarget,
    '实际排放(吨)': r.actualEmission,
    '可用配额(吨)': r.availableQuota,
    '可用CCER(吨)': r.availableCCER,
    '履约缺口(吨)': r.gap,
    '建议措施': r.suggestedAction,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '履约测算表');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(excelBuffer, filename || `履约测算表_${formatDate(new Date())}.xlsx`, EXCEL_MIME_TYPE);
};

export const exportToPDF = (title: string, content: string, filename?: string): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`生成日期: ${formatDate(new Date(), 'yyyy年MM月dd日 HH:mm')}`, margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
  
  lines.forEach((line: string) => {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(line, margin, yPosition);
    yPosition += 7;
  });

  const pdfBuffer = doc.output('blob');
  downloadFile(pdfBuffer, filename || `${title}_${formatDate(new Date())}.pdf`, PDF_MIME_TYPE);
};

export const exportDashboardToPDF = (
  stats: { label: string; value: string }[],
  filename?: string
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('碳资产总览报表', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`生成日期: ${formatDate(new Date(), 'yyyy年MM月dd日 HH:mm')}`, margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  stats.forEach((stat, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = margin;
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 12, 'F');
    }
    
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, margin + 5, yPosition + 3);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, pageWidth - margin - 5, yPosition + 3, { align: 'right' });
    yPosition += 12;
  });

  const pdfBuffer = doc.output('blob');
  downloadFile(pdfBuffer, filename || `碳资产总览_${formatDate(new Date())}.pdf`, PDF_MIME_TYPE);
};
