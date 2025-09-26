import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Modal, Form, Input } from 'antd';
import { ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import orderService from '../services/orderService';

interface CancelOrderComponentProps {
  orderId: number;
  currentStatus: string;
  onOrderCancelled?: (orderId: number) => void;
}

interface CancelInfo {
  can_cancel: boolean;
  reason?: string;
  time_remaining: string;
  time_remaining_seconds?: number;
}

const CancelOrderComponent: React.FC<CancelOrderComponentProps> = ({
  orderId,
  currentStatus,
  onOrderCancelled
}) => {
  const [cancelInfo, setCancelInfo] = useState<CancelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [form] = Form.useForm();

  // Check if order can be cancelled
  const checkCancelStatus = async () => {
    try {
      setLoading(true);
      const info = await orderService.canCancelOrder(orderId);
      setCancelInfo(info);
    } catch (error) {
      console.error('Error checking cancel status:', error);
      setCancelInfo({
        can_cancel: false,
        reason: 'Unable to check cancellation status',
        time_remaining: '0 minutes'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle order cancellation
  const handleCancel = async (values: { reason: string }) => {
    try {
      setCancelling(true);
      const result = await orderService.cancelOrder(orderId, values.reason);
      
      // Show success message
      Modal.success({
        title: 'Order Cancelled Successfully',
        content: (
          <div>
            <p>{result.message}</p>
            <p><strong>Refund Status:</strong> {result.refund_status}</p>
          </div>
        ),
      });

      setShowModal(false);
      form.resetFields();
      
      // Notify parent component
      if (onOrderCancelled) {
        onOrderCancelled(orderId);
      }
      
      // Refresh cancel info
      checkCancelStatus();
    } catch (error: any) {
      Modal.error({
        title: 'Cancellation Failed',
        content: error.message || 'Unable to cancel order. Please try again.',
      });
    } finally {
      setCancelling(false);
    }
  };

  // Auto-refresh every 30 seconds to update remaining time
  useEffect(() => {
    checkCancelStatus();
    
    const interval = setInterval(() => {
      if (cancelInfo?.can_cancel) {
        checkCancelStatus();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  // Don't show anything if order is already cancelled or delivered
  if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
    return null;
  }

  if (loading && !cancelInfo) {
    return (
      <Card loading={true} size="small">
        Checking cancellation status...
      </Card>
    );
  }

  if (!cancelInfo) {
    return null;
  }

  return (
    <Card 
      size="small" 
      title={
        <span>
          <ClockCircleOutlined /> Order Cancellation
        </span>
      }
    >
      {cancelInfo.can_cancel ? (
        <div>
          <Alert
            message={`You can cancel this order within: ${cancelInfo.time_remaining}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button 
            type="primary" 
            danger 
            onClick={() => setShowModal(true)}
            icon={<ExclamationCircleOutlined />}
          >
            Cancel Order
          </Button>
        </div>
      ) : (
        <Alert
          message="Order cannot be cancelled"
          description={cancelInfo.reason}
          type="warning"
          showIcon
        />
      )}

      <Modal
        title="Cancel Order"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
      >
        <Alert
          message="Order Cancellation"
          description="Please provide a reason for cancelling this order. Your refund will be processed within 3-5 business days."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCancel}
        >
          <Form.Item
            name="reason"
            label="Reason for cancellation"
            rules={[
              { required: true, message: 'Please provide a reason for cancellation' },
              { min: 10, message: 'Please provide at least 10 characters' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="e.g., Changed my mind, found better option, etc."
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setShowModal(false)} style={{ marginRight: 8 }}>
                Keep Order
              </Button>
              <Button 
                type="primary" 
                danger 
                htmlType="submit"
                loading={cancelling}
              >
                Cancel Order
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CancelOrderComponent;