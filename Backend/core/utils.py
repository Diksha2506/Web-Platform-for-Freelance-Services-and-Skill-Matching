from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.
    """
    response = drf_exception_handler(exc, context)

    if response is None:
        # Handle exceptions that DRF doesn't handle
        return Response(
            {
                "success": False,
                "detail": "Internal server error",
                "errors": {}
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Format DRF exceptions consistently
    if response.status_code >= 400:
        formatted_response = {
            "success": False,
            "detail": response.data.get("detail", "An error occurred"),
            "errors": {}
        }

        # Extract field-level errors
        for key, value in response.data.items():
            if key != "detail":
                formatted_response["errors"][key] = value

        response.data = formatted_response

    return response


class APIResponse:
    """
    Helper class to create consistent API responses.
    """

    @staticmethod
    def success(data=None, message="Success", status_code=status.HTTP_200_OK):
        """Return a success response."""
        return Response(
            {
                "success": True,
                "detail": message,
                "data": data
            },
            status=status_code
        )

    @staticmethod
    def created(data=None, message="Created successfully"):
        """Return a 201 created response."""
        return APIResponse.success(data, message, status.HTTP_201_CREATED)

    @staticmethod
    def error(message="An error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Return an error response."""
        return Response(
            {
                "success": False,
                "detail": message,
                "errors": errors or {}
            },
            status=status_code
        )

    @staticmethod
    def not_found(message="Resource not found"):
        """Return a 404 not found response."""
        return APIResponse.error(message, status_code=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def unauthorized(message="Unauthorized"):
        """Return a 401 unauthorized response."""
        return APIResponse.error(message, status_code=status.HTTP_401_UNAUTHORIZED)

    @staticmethod
    def forbidden(message="Forbidden"):
        """Return a 403 forbidden response."""
        return APIResponse.error(message, status_code=status.HTTP_403_FORBIDDEN)


def paginate_queryset(queryset, request, paginator_class=None):
    """
    Helper function to manually paginate a queryset.
    """
    from rest_framework.pagination import PageNumberPagination
    
    if paginator_class is None:
        paginator_class = PageNumberPagination
    
    paginator = paginator_class()
    return paginator.paginate_queryset(queryset, request)
