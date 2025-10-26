from django.test import TestCase


class BulkOrderModelFieldTest(TestCase):
    """Simple test to ensure BulkOrder.order FK is nullable and uses SET_NULL

    This is a lightweight check that doesn't depend on DB rows. It verifies the
    model definition was updated so bulk orders can exist without creating a
    regular Order entry.
    """

    def test_order_field_nullable_and_set_null(self):
        from apps.orders.models import BulkOrder
        from django.db import models

        field = BulkOrder._meta.get_field('order')

        # Field should allow nulls and blanks
        self.assertTrue(field.null, "BulkOrder.order.null should be True")
        self.assertTrue(field.blank, "BulkOrder.order.blank should be True")

        # Ensure on_delete is SET_NULL
        remote_on_delete = getattr(field.remote_field, 'on_delete', None)
        self.assertEqual(remote_on_delete, models.SET_NULL, "BulkOrder.order.on_delete should be SET_NULL")
