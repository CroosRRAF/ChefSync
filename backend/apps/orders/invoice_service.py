"""
Invoice generation service for orders
"""
from datetime import datetime
from io import BytesIO
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas

from .models import Order, BulkOrder


class InvoiceService:
    """Service for generating and emailing invoices"""
    
    @staticmethod
    def generate_order_invoice_pdf(order: Order) -> BytesIO:
        """Generate PDF invoice for a regular order"""
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#FF6B35'),
            spaceAfter=12,
            alignment=1,  # Center alignment
        )
        
        # Add title
        elements.append(Paragraph("INVOICE", title_style))
        elements.append(Spacer(1, 12))
        
        # Company info
        company_info = [
            ["<b>ChefSync</b>"],
            ["Food Delivery Platform"],
            ["Email: support@chefsync.com"],
            ["Phone: +94 77 123 4567"]
        ]
        company_table = Table(company_info, colWidths=[6*inch])
        company_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(company_table)
        elements.append(Spacer(1, 12))
        
        # Invoice details
        invoice_data = [
            ["Invoice Number:", order.order_number],
            ["Order Date:", order.created_at.strftime("%B %d, %Y %I:%M %p")],
            ["Status:", order.status.upper()],
            ["Payment Method:", order.payment_method or "Cash on Delivery"],
        ]
        
        invoice_table = Table(invoice_data, colWidths=[2*inch, 4*inch])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F5')),
        ]))
        elements.append(invoice_table)
        elements.append(Spacer(1, 20))
        
        # Customer and Chef Info
        info_data = [
            ["<b>Customer Information</b>", "<b>Chef Information</b>"],
            [f"Name: {order.customer.name or order.customer.username}", 
             f"Name: {order.chef.name or order.chef.username}"],
            [f"Email: {order.customer.email}", 
             f"Email: {order.chef.email}"],
            [f"Phone: {getattr(order.customer, 'phone_no', 'N/A')}", 
             f"Phone: {getattr(order.chef, 'phone_no', 'N/A')}"],
        ]
        
        info_table = Table(info_data, colWidths=[3*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFE5B4')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        # Delivery Address
        if order.delivery_address:
            addr_data = [
                ["<b>Delivery Address</b>"],
                [order.delivery_address],
            ]
            if order.delivery_instructions:
                addr_data.append([f"Instructions: {order.delivery_instructions}"])
            
            addr_table = Table(addr_data, colWidths=[6*inch])
            addr_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFE5B4')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(addr_table)
            elements.append(Spacer(1, 20))
        
        # Order Items Table
        items_data = [
            ["<b>Item</b>", "<b>Size</b>", "<b>Qty</b>", "<b>Unit Price</b>", "<b>Total</b>"]
        ]
        
        for item in order.items.all():
            items_data.append([
                item.food_name or "Item",
                getattr(item.price, 'size', 'Regular') if item.price else 'N/A',
                str(item.quantity),
                f"LKR {item.unit_price:.2f}" if item.unit_price else "N/A",
                f"LKR {item.total_price:.2f}" if item.total_price else "N/A",
            ])
        
        items_table = Table(items_data, colWidths=[2.5*inch, 1*inch, 0.7*inch, 1.2*inch, 1.2*inch])
        items_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (4, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF6B35')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))
        
        # Summary Table
        summary_data = [
            ["Subtotal:", f"LKR {order.subtotal:.2f}"],
            ["Delivery Fee:", f"LKR {order.delivery_fee:.2f}"],
            ["Tax (10%):", f"LKR {order.tax_amount:.2f}"],
        ]
        
        if order.discount_amount and order.discount_amount > 0:
            summary_data.append(["Discount:", f"- LKR {order.discount_amount:.2f}"])
        
        summary_data.append(["<b>Total Amount:</b>", f"<b>LKR {order.total_amount:.2f}</b>"])
        
        summary_table = Table(summary_data, colWidths=[4.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FFE5B4')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
        
        # Footer
        footer_text = "Thank you for ordering with ChefSync! We hope you enjoyed your meal."
        footer = Paragraph(footer_text, styles['Normal'])
        elements.append(footer)
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_bulk_order_invoice_pdf(bulk_order: BulkOrder) -> BytesIO:
        """Generate PDF invoice for a bulk order"""
        buffer = BytesIO()
        
        # Similar structure to regular order but adapted for bulk orders
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        elements = []
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#9B59B6'),
            spaceAfter=12,
            alignment=1,
        )
        
        elements.append(Paragraph("BULK ORDER INVOICE", title_style))
        elements.append(Spacer(1, 12))
        
        # Company info (same as regular)
        company_info = [
            ["<b>ChefSync - Bulk Catering</b>"],
            ["Event Catering Platform"],
            ["Email: catering@chefsync.com"],
            ["Phone: +94 77 123 4567"]
        ]
        company_table = Table(company_info, colWidths=[6*inch])
        company_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(company_table)
        elements.append(Spacer(1, 12))
        
        # Invoice details
        invoice_data = [
            ["Invoice Number:", bulk_order.order_number],
            ["Order Date:", bulk_order.created_at.strftime("%B %d, %Y %I:%M %p")],
            ["Event Date:", bulk_order.event_date.strftime("%B %d, %Y") if bulk_order.event_date else "N/A"],
            ["Number of Persons:", str(bulk_order.num_persons)],
            ["Status:", bulk_order.status.upper()],
        ]
        
        invoice_table = Table(invoice_data, colWidths=[2*inch, 4*inch])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F5')),
        ]))
        elements.append(invoice_table)
        elements.append(Spacer(1, 20))
        
        # Summary
        summary_data = [
            ["Menu:", bulk_order.menu_name or "Custom Bulk Order"],
            ["Subtotal:", f"LKR {bulk_order.subtotal:.2f}"],
            ["Delivery Fee:", f"LKR {bulk_order.delivery_fee:.2f}"],
            ["<b>Total Amount:</b>", f"<b>LKR {bulk_order.total_amount:.2f}</b>"],
        ]
        
        summary_table = Table(summary_data, colWidths=[4.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E8DAEF')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
        
        footer_text = "Thank you for choosing ChefSync for your event catering!"
        footer = Paragraph(footer_text, styles['Normal'])
        elements.append(footer)
        
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def send_invoice_email(order, pdf_buffer: BytesIO, recipient_email: Optional[str] = None):
        """Send invoice via email"""
        if not recipient_email:
            recipient_email = order.customer.email
        
        # Determine order type
        is_bulk = isinstance(order, BulkOrder)
        order_type = "Bulk Order" if is_bulk else "Order"
        
        subject = f"ChefSync Invoice - {order_type} #{order.order_number}"
        
        # Email body
        context = {
            'order': order,
            'order_type': order_type,
            'customer_name': order.created_by.name if is_bulk else order.customer.name,
        }
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #FF6B35;">Your ChefSync Invoice</h2>
                <p>Dear {context['customer_name']},</p>
                <p>Thank you for your order! Please find attached your invoice for {order_type} #{order.order_number}.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #FF6B35;">{order_type} Summary</h3>
                    <p><strong>Order Number:</strong> {order.order_number}</p>
                    <p><strong>Total Amount:</strong> LKR {order.total_amount:.2f}</p>
                    <p><strong>Status:</strong> {order.status.upper()}</p>
                </div>
                
                <p>If you have any questions about your invoice, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>
                <strong>ChefSync Team</strong><br>
                support@chefsync.com</p>
            </div>
        </body>
        </html>
        """
        
        # Create email
        email = EmailMessage(
            subject=subject,
            body=html_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient_email],
        )
        email.content_subtype = 'html'
        
        # Attach PDF
        pdf_buffer.seek(0)
        email.attach(
            f'invoice-{order.order_number}.pdf',
            pdf_buffer.read(),
            'application/pdf'
        )
        
        # Send email
        email.send()
        
        return True

