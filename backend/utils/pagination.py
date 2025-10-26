"""
Custom pagination classes for the API
"""

from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination that allows clients to control page size
    using the 'limit' or 'page_size' query parameter
    """

    page_size = 10
    page_size_query_param = "limit"  # Allow client to set page size with ?limit=X
    max_page_size = 100  # Maximum limit is 100
