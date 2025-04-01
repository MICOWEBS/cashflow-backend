import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Transaction from '../models/Transaction';
import { Stream } from 'stream';

export class ReportService {
  static async generatePDFReport(transactions: Transaction[]): Promise<Stream> {
    const doc = new PDFDocument();
    
    // Add header
    doc.fontSize(20).text('Transaction Report', { align: 'center' });
    doc.moveDown();

    // Add table headers
    const tableTop = 150;
    doc.fontSize(12);
    doc.text('Date', 50, tableTop);
    doc.text('Type', 150, tableTop);
    doc.text('Amount', 250, tableTop);
    doc.text('Payment Mode', 350, tableTop);
    doc.text('Vendor/Customer', 450, tableTop);
    doc.text('Company', 550, tableTop);
    doc.text('Remarks', 650, tableTop);

    // Add transactions
    let y = tableTop + 30;
    transactions.forEach((transaction) => {
      doc.text(transaction.date.toLocaleDateString(), 50, y);
      doc.text(transaction.type, 150, y);
      doc.text(transaction.amount.toString(), 250, y);
      doc.text(transaction.paymentMode, 350, y);
      
      // Show vendor or customer name based on transaction type
      const entityName = transaction.type === 'payment' 
        ? transaction.Vendor?.name || 'N/A'
        : transaction.Customer?.name || 'N/A';
      doc.text(entityName, 450, y);
      
      // Show company name
      const companyName = transaction.type === 'payment'
        ? transaction.Vendor?.companyName || 'N/A'
        : transaction.Customer?.companyName || 'N/A';
      doc.text(companyName, 550, y);
      
      doc.text(transaction.remarks || '', 650, y);
      y += 30;
    });

    // Important: pipe the document to the stream BEFORE calling doc.end()
    const stream = new Stream.PassThrough();
    doc.pipe(stream);
    doc.end();
    
    return stream;
  }

  static async generateExcelReport(transactions: Transaction[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Payment Mode', key: 'paymentMode', width: 15 },
      { header: 'Vendor/Customer', key: 'entityName', width: 30 },
      { header: 'Company', key: 'companyName', width: 30 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    // Add rows
    transactions.forEach(transaction => {
      worksheet.addRow({
        date: transaction.date.toLocaleDateString(),
        type: transaction.type,
        amount: transaction.amount,
        paymentMode: transaction.paymentMode,
        entityName: transaction.type === 'payment' 
          ? transaction.Vendor?.name || 'N/A'
          : transaction.Customer?.name || 'N/A',
        companyName: transaction.type === 'payment'
          ? transaction.Vendor?.companyName || 'N/A'
          : transaction.Customer?.companyName || 'N/A',
        remarks: transaction.remarks || '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }
} 