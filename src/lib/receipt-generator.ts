import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, getMonthName } from './utils';

/**
 * Helper to convert number to Indonesian words (Terbilang)
 */
function terbilang(n: number): string {
  const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let res = "";
  const num = Math.abs(Math.floor(n));
  
  if (num < 12) res = words[num];
  else if (num < 20) res = terbilang(num - 10) + " Belas";
  else if (num < 100) res = terbilang(Math.floor(num / 10)) + " Puluh " + terbilang(num % 10);
  else if (num < 200) res = "Seratus " + terbilang(num - 100);
  else if (num < 1000) res = terbilang(Math.floor(num / 100)) + " Ratus " + terbilang(num % 100);
  else if (num < 2000) res = "Seribu " + terbilang(num - 1000);
  else if (num < 1000000) res = terbilang(Math.floor(num / 1000)) + " Ribu " + terbilang(num % 1000);
  else if (num < 1000000000) res = terbilang(Math.floor(num / 1000000)) + " Juta " + terbilang(num % 1000000);
  
  return res.trim().replace(/\s+/g, ' ');
}

interface ReceiptData {
  payment: any;
  student: any;
  settings: {
    school_name: string;
    school_address: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
  };
  components?: any[]; // Dynamic billing components breakdown
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  try {
    const { payment, student, settings, components } = data;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5' 
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // 1. Header - Center Aligned Clean
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.school_name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitAddress = doc.splitTextToSize(settings.school_address || 'Alamat Belum Diatur', 80);
    doc.text(splitAddress, pageWidth / 2, 20, { align: 'center' });
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(10, 28, pageWidth - 10, 28);
    doc.setLineWidth(0.1);
    doc.line(10, 29, pageWidth - 10, 29);

    // 2. Judul Kwitansi
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('KWITANSI PEMBAYARAN', pageWidth / 2, 38, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const receiptNo = `No: KWT/${payment.year}${String(payment.month).padStart(2, '0')}/${payment.id.substring(0, 5).toUpperCase()}`;
    doc.text(receiptNo, pageWidth / 2, 43, { align: 'center' });

    // 3. Identitas Santri
    let currentY = 55;
    const drawRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(': ' + value, 50, currentY);
      currentY += 7;
    };

    drawRow('Telah Terima Dari', student.name || 'N/A');
    drawRow('NISN / Kelas', `${student.nisn || '-'} / ${student.class_room || '-'}`);
    drawRow('Untuk Pembayaran', `SPP Bulan ${getMonthName(payment.month)} ${payment.year}`);

    // 4. Tabel Rincian
    currentY += 2;
    if (components && components.length > 0) {
      const tableRows = components.map(c => [
        c.label,
        formatCurrency(payment.rates?.[c.key] || 0)
      ]);
      
      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        head: [['Deskripsi Pembayaran', 'Jumlah']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right', cellWidth: 35 } }
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // 5. Total Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, pageWidth - 30, 14, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, currentY, pageWidth - 30, 14, 'D');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`TOTAL: ${formatCurrency(payment.amount)}`, 20, currentY + 6);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    const amountNum = Number(payment.amount) || 0;
    const terbilangText = `Terbilang: # ${terbilang(amountNum)} Rupiah #`;
    doc.text(terbilangText, 20, currentY + 11);
    
    currentY += 22;

    // 6. Status LUNAS (Digital Stamp)
    const stampX = pageWidth - 55;
    const stampY = currentY;
    
    doc.setDrawColor(34, 197, 94); // Green-500
    doc.setLineWidth(0.8);
    doc.rect(stampX, stampY, 40, 18);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94);
    doc.text('LUNAS', stampX + 20, stampY + 10, { align: 'center' });
    
    const dateStr = new Date(payment.verified_at || payment.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.setFontSize(8);
    doc.text(dateStr, stampX + 20, stampY + 15, { align: 'center' });
    
    // Teks Nama Bendahara (Garis Kosong)
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ADMIN KEUANGAN', 25, currentY + 12);
    doc.setLineWidth(0.2);
    doc.line(15, currentY + 13, 50, currentY + 13);

    // 7. Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`ID Transaksi: ${payment.id} | Dicetak otomatis oleh Sistem SPP PPMH`, pageWidth / 2, pageHeight - 8, { align: 'center' });

    // Save the PDF
    doc.save(`Kwitansi_${(student.name || 'Santri').replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};
