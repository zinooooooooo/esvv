import jsPDF from 'jspdf';

/**
 * PDF Generation Service for Appointment Forms
 * Creates professional PDF forms similar to the dental chart design
 */

export const generateAppointmentPDF = (appointment) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor = '#111827'; // gray-900 to better match preview
  const secondaryColor = '#6b7280'; // gray-500
  const accentColor = '#3b82f6'; // blue-500
  const lightGray = '#f3f4f6'; // gray-100
  
  // Helper function to add text with styling
  const addText = (text, x, y, options = {}) => {
    const {
      fontSize = 12,
      fontStyle = 'normal',
      color = primaryColor,
      align = 'left'
    } = options;
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color);
    doc.text(text, x, y, { align });
  };
  
  // Helper function to add line
  const addLine = (x1, y1, x2, y2, color = secondaryColor, width = 0.5) => {
    doc.setDrawColor(color);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
  };
  
  // Helper function to add rectangle
  const addRect = (x, y, width, height, fillColor = null, strokeColor = secondaryColor) => {
    if (fillColor) {
      doc.setFillColor(fillColor);
      doc.rect(x, y, width, height, 'F');
    }
    if (strokeColor) {
      doc.setDrawColor(strokeColor);
      doc.rect(x, y, width, height, 'S');
    }
  };
  
  // Header Section to match preview
  const fullName = [appointment.first_name, appointment.middle_name, appointment.last_name]
    .map(v => (v || '').trim())
    .filter(v => v.length > 0)
    .join(' ');
  const headerAppointmentDate = appointment.appointment_date
    ? new Date(appointment.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not scheduled';

  // Title
  addText(`Appointment Form - ${fullName}`, pageWidth / 2, 20, {
    fontSize: 16,
    fontStyle: 'bold',
    align: 'center',
    color: primaryColor
  });

  // Left org info (matches preview strings)
  addText('DSWD', 15, 30, { fontSize: 10, fontStyle: 'bold', color: primaryColor });
  addText('SAN VICENTE MUNICIPAL HALL', 15, 36, { fontSize: 12, fontStyle: 'bold', color: primaryColor });
  addText('San VICENTE, Ilocos Sur', 15, 42, { fontSize: 10, color: secondaryColor });
  addText('esvmswdo@gmail.com', 15, 48, { fontSize: 10, color: secondaryColor });

  // Right side: Date and Patient
  addText(`Date: ${headerAppointmentDate}`, pageWidth - 15, 34, { fontSize: 10, align: 'right', color: secondaryColor });
  addText(`Appointee: ${fullName}`, pageWidth - 15, 40, { fontSize: 10, align: 'right', color: secondaryColor });
  
  // Personal Information Section
  const sectionY = 58;
  addRect(15, sectionY, pageWidth - 30, 8, lightGray, secondaryColor);
  addText('Personal Information', 20, sectionY + 5.5, {
    fontSize: 12,
    fontStyle: 'bold',
    color: primaryColor
  });

  // Personal Information Fields to mirror preview layout
  const fieldY = sectionY + 15;
  const leftColX = 20;
  // Compute three equal columns across the content width
  const contentWidth = pageWidth - 40; // margins 20mm on both sides
  const gapBetweenColumns = 10;
  const singleColumnWidth = (contentWidth - gapBetweenColumns * 2) / 3;
  const midColX = leftColX + singleColumnWidth + gapBetweenColumns;
  const rightColX = midColX + singleColumnWidth + gapBetweenColumns;
  const fieldSpacing = 8;

  // Row: First, Middle, Last names as three columns
  addText(`First Name: ${appointment.first_name || ''}`, leftColX, fieldY, { fontSize: 10 });
  addText(`Middle Name: ${appointment.middle_name || ''}`, midColX, fieldY, { fontSize: 10 });
  addText(`Last Name: ${appointment.last_name || ''}`, rightColX, fieldY, { fontSize: 10 });

  // Row: Gender, Barangay
  addText(`Gender: ${appointment.gender || ''}`, leftColX, fieldY + fieldSpacing, { fontSize: 10 });
  addText(`Barangay: ${appointment.barangay || ''}`, rightColX, fieldY + fieldSpacing, { fontSize: 10 });

  // Row: Cellphone
  addText(`Cellphone: ${appointment.phone || ''}`, leftColX, fieldY + fieldSpacing * 2, { fontSize: 10 });
  
  // Service Appointed Section
  const serviceSectionY = fieldY + fieldSpacing * 3 + 8;
  addRect(15, serviceSectionY, pageWidth - 30, 8, lightGray, secondaryColor);
  addText('Service Appointed', 20, serviceSectionY + 5.5, {
    fontSize: 12,
    fontStyle: 'bold',
    color: primaryColor
  });

  const serviceFieldY = serviceSectionY + 15;
  const headerLikeDate = headerAppointmentDate;
  addText(`Sector: ${appointment.service_type || 'Not specified'}`, leftColX, serviceFieldY, { fontSize: 10 });
  addText(`Appointee: ${appointment.appointee || 'Not specified'}`, leftColX, serviceFieldY + fieldSpacing, { fontSize: 10 });
  addText(`Service: ${appointment.service || 'Not specified'}`, leftColX, serviceFieldY + fieldSpacing * 2, { fontSize: 10 });
  addText(`Date of Appointment: ${headerLikeDate}`, leftColX, serviceFieldY + fieldSpacing * 3, { fontSize: 10 });
  
  // Time field
  const timeValue = appointment.appointment_time || 'Not scheduled';
  addText(`Time: ${timeValue}`, leftColX, serviceFieldY + fieldSpacing * 4, { fontSize: 10 });

  // Notes block
  const notesY = serviceFieldY + fieldSpacing * 5;
  addText('Notes:', leftColX, notesY, { fontSize: 10 });
  const notesText = appointment.appointment_notes || 'No notes provided';
  // Simple wrap for notes within available width
  const notesLines = doc.splitTextToSize(notesText, pageWidth - 40);
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  doc.text(notesLines, leftColX + 18, notesY);
  
  // ID Information Section
  const idSectionY = notesY + 20;
  addRect(15, idSectionY, pageWidth - 30, 8, lightGray, secondaryColor);
  addText('ID Information', 20, idSectionY + 5.5, {
    fontSize: 12,
    fontStyle: 'bold',
    color: primaryColor
  });

  const idFieldY = idSectionY + 15;
  addText(`Type of ID: ${appointment.id_type || 'Not specified'}`, leftColX, idFieldY, { fontSize: 10 });
  addText(`ID Number: ${appointment.id_number || 'Not specified'}`, leftColX, idFieldY + fieldSpacing, { fontSize: 10 });
  
  // Status Information (badge-like)
  const statusY = idFieldY + fieldSpacing * 2 + 8;
  const status = appointment.status || 'Pending';
  const statusColor = status === 'approved' ? '#059669'
    : status === 'declined' ? '#dc2626'
    : status === 'scheduled' ? '#2563eb'
    : '#d97706';
  addText('Status:', leftColX, statusY, { fontSize: 10, fontStyle: 'bold' });
  // Draw a rounded-like rect (approximation) and put status text inside
  addRect(leftColX + 14, statusY - 5.5, 25, 7, '#ffffff', statusColor);
  addText(status, leftColX + 26.5, statusY - 0.5, { fontSize: 9, color: statusColor, align: 'center' });
  
  // Footer matches preview
  const footerY = pageHeight - 15;
  addText('Page 1/1', pageWidth - 15, footerY, { fontSize: 10, align: 'right', color: secondaryColor });
  
  return doc;
};

/**
 * Download PDF for a specific appointment
 */
export const downloadAppointmentPDF = (appointment) => {
  try {
    const doc = generateAppointmentPDF(appointment);
    const fileName = `${appointment.service || 'Service'} Appointment of ${appointment.first_name || 'Client'}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Generate PDF for multiple appointments (batch download)
 */
export const downloadMultipleAppointmentPDFs = (appointments) => {
  try {
    appointments.forEach((appointment, index) => {
      setTimeout(() => {
        downloadAppointmentPDF(appointment);
      }, index * 500); // Delay between downloads to prevent browser blocking
    });
  } catch (error) {
    console.error('Error generating multiple PDFs:', error);
    throw new Error('Failed to generate PDFs. Please try again.');
  }
};

