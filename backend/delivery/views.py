from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Delivery
from .serializer import DeliverySerializer, DeliveryStatusUpdateSerializer
from django.utils import timezone
from django.contrib.auth.models import User

# Fetch all deliveries ready for assignment
@api_view(['GET'])
def ready_deliveries(request):
    deliveries = Delivery.objects.filter(status='Pending')
    serializer = DeliverySerializer(deliveries, many=True)
    return Response(serializer.data)


# Accept a delivery (assign agent)
@api_view(['POST'])
def accept_delivery(request, pk):
    try:
        delivery = Delivery.objects.get(pk=pk)
    except Delivery.DoesNotExist:
        return Response({'error': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if delivery.status != 'Pending':
        return Response({'error': 'Delivery already assigned'}, status=status.HTTP_400_BAD_REQUEST)

    delivery.agent = request.user
    delivery.status = 'Accepted'
    delivery.assigned_at = timezone.now()
    delivery.accepted_at = timezone.now()
    delivery.save()
    
    return Response({'message': 'Delivery accepted', 'delivery_id': delivery.id})


# Update delivery status
@api_view(['PATCH'])
def update_status(request, pk):
    try:
        delivery = Delivery.objects.get(pk=pk)
    except Delivery.DoesNotExist:
        return Response({'error': 'Delivery not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = DeliveryStatusUpdateSerializer(delivery, data=request.data, partial=True)
    if serializer.is_valid():
        status_value = serializer.validated_data.get('status')
        now = timezone.now()

        if status_value == 'Out for Delivery':
            delivery.picked_at = now
        elif status_value == 'Delivered':
            delivery.delivered_at = now

        serializer.save()
        return Response({'message': 'Status updated', 'delivery_id': delivery.id})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)