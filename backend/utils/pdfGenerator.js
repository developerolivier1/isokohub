const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('./logger');

const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isokohub-'));
      const filePath = path.join(tmpDir, `invoice-${order.orderNumber}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const primaryColor = '#667eea';
      const secondaryColor = '#764ba2';
      const grayColor = '#666666';
      const lightGray = '#f5f5f5';

      doc.rect(0, 0, doc.page.width, 150).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold')
        .text('ISOKOHUB', 50, 40);
      doc.fontSize(12).font('Helvetica')
        .text('Enterprise Marketplace Platform', 50, 75);
      doc.fontSize(10)
        .text(`Invoice #: ${order.orderNumber}`, 50, 100)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 115);

      if (order.tenant?.name) {
        doc.text(`Tenant: ${order.tenant.name}`, 400, 40, { align: 'right' });
      }
      doc.text(`Status: ${order.status.toUpperCase()}`, 400, 55, { align: 'right' });

      doc.fillColor('#333333').fontSize(14).font('Helvetica-Bold')
        .text('Bill To:', 50, 180);
      doc.fillColor(grayColor).fontSize(10).font('Helvetica')
        .text(order.shippingAddress?.fullName || order.user?.name || 'N/A', 50, 200)
        .text(order.shippingAddress?.street || '', 50, 215)
        .text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}`, 50, 230)
        .text(order.shippingAddress?.country || '', 50, 245)
        .text(`Phone: ${order.shippingAddress?.phone || ''}`, 50, 260)
        .text(`Email: ${order.user?.email || ''}`, 50, 275);

      doc.fillColor('#333333').fontSize(14).font('Helvetica-Bold')
        .text('Payment Details:', 350, 180);
      doc.fillColor(grayColor).fontSize(10).font('Helvetica')
        .text(`Method: ${order.paymentMethod || 'N/A'}`, 350, 200)
        .text(`Status: ${order.paymentStatus || 'N/A'}`, 350, 215)
        .text(`Currency: ${order.currency || 'RWF'}`, 350, 230);

      doc.y = 310;
      const tableTop = doc.y;

      doc.rect(50, tableTop, 495, 20).fill(lightGray);
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
      doc.text('Item', 60, tableTop + 5);
      doc.text('Qty', 300, tableTop + 5, { width: 40, align: 'center' });
      doc.text('Price', 370, tableTop + 5, { width: 70, align: 'right' });
      doc.text('Total', 470, tableTop + 5, { width: 70, align: 'right' });

      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      let yPos = tableTop + 25;
      order.items?.forEach((item, i) => {
        if (i % 2 === 0) {
          doc.rect(50, yPos - 3, 495, 20).fill(i % 2 === 0 ? '#fafafa' : '#ffffff');
        }
        doc.fillColor('#333333').fontSize(9);
        doc.text(item.productName || item.name || 'Product', 60, yPos, { width: 230 });
        doc.text(item.quantity.toString(), 300, yPos, { width: 40, align: 'center' });
        doc.text(`${order.currency} ${item.price?.toFixed(2)}`, 370, yPos, { width: 70, align: 'right' });
        doc.text(`${order.currency} ${(item.price * item.quantity).toFixed(2)}`, 470, yPos, { width: 70, align: 'right' });
        yPos += 20;
      });

      doc.rect(50, yPos + 5, 495, 0).strokeColor('#dddddd').lineWidth(1).stroke();

      const totalsY = yPos + 20;
      doc.fillColor(grayColor).fontSize(10).font('Helvetica');
      doc.text('Subtotal:', 370, totalsY, { width: 170, align: 'right' });
      doc.fillColor('#333333').text(`${order.currency} ${order.subtotal?.toFixed(2)}`, 370, totalsY, { width: 170, align: 'right' });

      doc.fillColor(grayColor).fontSize(10).font('Helvetica');
      doc.text('Shipping:', 370, totalsY + 18, { width: 170, align: 'right' });
      doc.fillColor('#333333').text(`${order.currency} ${order.shippingFee?.toFixed(2)}`, 370, totalsY + 18, { width: 170, align: 'right' });

      doc.fillColor(grayColor).fontSize(10).font('Helvetica');
      doc.text('Tax:', 370, totalsY + 36, { width: 170, align: 'right' });
      doc.fillColor('#333333').text(`${order.currency} ${order.tax?.toFixed(2)}`, 370, totalsY + 36, { width: 170, align: 'right' });

      doc.rect(50, totalsY + 54, 495, 0).strokeColor('#667eea').lineWidth(2).stroke();

      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold');
      doc.text('Total:', 370, totalsY + 62, { width: 170, align: 'right' });
      doc.text(`${order.currency} ${order.total?.toFixed(2)}`, 370, totalsY + 62, { width: 170, align: 'right' });

      doc.fillColor(grayColor).fontSize(8).font('Helvetica');
      doc.text('Thank you for shopping with ISOKOHUB!', 50, doc.page.height - 80, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 65, { align: 'center', color: '#999999' });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      logger.error(`PDF generation error: ${error.message}`);
      reject(error);
    }
  });
};

const generateReportExcel = async ({ title, headers, rows, sheetName = 'Report' }) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ISOKOHUB';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const titleRow = sheet.addRow([title]);
    titleRow.font = { size: 16, bold: true, color: { argb: '667eea' } };
    sheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
    sheet.addRow([]);

    const headerRow = sheet.addRow(headers.map(h => h.label));
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667eea' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    rows.forEach((rowData, index) => {
      const row = sheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } };
        });
      }
    });

    headers.forEach((h, idx) => {
      const column = sheet.getColumn(idx + 1);
      column.width = h.width || 15;
      column.key = h.key;
    });

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isokohub-'));
    const filePath = path.join(tmpDir, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

    await workbook.xlsx.writeFile(filePath);
    logger.info(`Excel report generated: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`Excel generation error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateInvoicePDF,
  generateReportExcel,
};
