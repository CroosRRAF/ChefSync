"""
Invoice generation views
"""
from django.http import FileResponse, HttpResponse
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .invoice_service import InvoiceService
from .models import Order, BulkOrder


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_order_invoice(request, pk):
    """Generate and download invoice for a regular order"""
    try:
        order = Order.objects.get(pk=pk)
        
        # Check permission - only customer or chef can get invoice
        if order.customer != request.user and order.chef != request.user:
            return Response(
                {"error": "You don't have permission to view this invoice"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if order status allows invoice generation
        # Invoices should only be available for orders that are confirmed or beyond
        invalid_statuses = ['cart', 'pending']
        if order.status in invalid_statuses:
            return Response(
                {"error": f"Invoice not available for orders with status '{order.status}'. Order must be confirmed first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check payment status - invoice should only be generated for paid orders
        if order.payment_status != 'paid':
            return Response(
                {"error": f"Invoice not available for unpaid orders. Current payment status: '{order.payment_status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate PDF
        pdf_buffer = InvoiceService.generate_order_invoice_pdf(order)
        
        # Return as file response
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'invoice-{order.order_number}.pdf',
            content_type='application/pdf'
        )
        
        return response
        
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to generate invoice: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_order_invoice(request, pk):
    """Email invoice for a regular order"""
    try:
        order = Order.objects.get(pk=pk)
        
        # Check permission
        if order.customer != request.user and order.chef != request.user:
            return Response(
                {"error": "You don't have permission to email this invoice"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if order status allows invoice generation
        invalid_statuses = ['cart', 'pending']
        if order.status in invalid_statuses:
            return Response(
                {"error": f"Invoice not available for orders with status '{order.status}'. Order must be confirmed first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check payment status
        if order.payment_status != 'paid':
            return Response(
                {"error": f"Invoice not available for unpaid orders. Current payment status: '{order.payment_status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get recipient email (default to customer's email)
        recipient_email = request.data.get('email', order.customer.email)
        
        # Generate PDF
        pdf_buffer = InvoiceService.generate_order_invoice_pdf(order)
        
        # Send email
        InvoiceService.send_invoice_email(order, pdf_buffer, recipient_email)
        
        return Response({
            "success": f"Invoice sent to {recipient_email}",
            "message": "Please check your email"
        })
        
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to send invoice: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_bulk_order_invoice(request, pk):
    """Generate and download invoice for a bulk order"""
    try:
        bulk_order = BulkOrder.objects.get(pk=pk)
        
        # Check permission
        if bulk_order.created_by != request.user and bulk_order.chef != request.user:
            return Response(
                {"error": "You don't have permission to view this invoice"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if bulk order status allows invoice generation
        invalid_statuses = ['pending', 'draft']
        if bulk_order.status in invalid_statuses:
            return Response(
                {"error": f"Invoice not available for bulk orders with status '{bulk_order.status}'. Order must be confirmed first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check payment status for bulk orders
        if bulk_order.payment_status != 'paid':
            return Response(
                {"error": f"Invoice not available for unpaid bulk orders. Current payment status: '{bulk_order.payment_status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate PDF
        pdf_buffer = InvoiceService.generate_bulk_order_invoice_pdf(bulk_order)
        
        # Return as file response
        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f'invoice-{bulk_order.order_number}.pdf',
            content_type='application/pdf'
        )
        
        return response
        
    except BulkOrder.DoesNotExist:
        return Response(
            {"error": "Bulk order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to generate invoice: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_bulk_order_invoice(request, pk):
    """Email invoice for a bulk order"""
    try:
        bulk_order = BulkOrder.objects.get(pk=pk)
        
        # Check permission
        if bulk_order.created_by != request.user and bulk_order.chef != request.user:
            return Response(
                {"error": "You don't have permission to email this invoice"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if bulk order status allows invoice generation
        invalid_statuses = ['pending', 'draft']
        if bulk_order.status in invalid_statuses:
            return Response(
                {"error": f"Invoice not available for bulk orders with status '{bulk_order.status}'. Order must be confirmed first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check payment status for bulk orders
        if bulk_order.payment_status != 'paid':
            return Response(
                {"error": f"Invoice not available for unpaid bulk orders. Current payment status: '{bulk_order.payment_status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get recipient email (default to customer's email)
        recipient_email = request.data.get('email', bulk_order.created_by.email)
        
        # Generate PDF
        pdf_buffer = InvoiceService.generate_bulk_order_invoice_pdf(bulk_order)
        
        # Send email
        InvoiceService.send_invoice_email(bulk_order, pdf_buffer, recipient_email)
        
        return Response({
            "success": f"Invoice sent to {recipient_email}",
            "message": "Please check your email"
        })
        
    except BulkOrder.DoesNotExist:
        return Response(
            {"error": "Bulk order not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to send invoice: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

