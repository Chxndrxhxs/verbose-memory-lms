from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnvelopePagination(PageNumberPagination):
    page_size = 12

    def get_paginated_response(self, data):
        return Response(
            {
                "data": data,
                "error": None,
                "meta": {
                    "page": self.page.number,
                    "total": self.page.paginator.count,
                    "pages": self.page.paginator.num_pages,
                },
            }
        )


def paginate_queryset_view(request, queryset, serializer_class, context=None):
    """Paginate a queryset in function-based views.

    Returns a paginated envelope only when ?page is present,
    otherwise returns None so callers keep the legacy array shape.
    """
    if request.query_params.get("page") is None:
        return None
    paginator = EnvelopePagination()
    page = paginator.paginate_queryset(queryset, request)
    if page is None:
        return None
    serializer = serializer_class(page, many=True, context=context or {"request": request})
    return paginator.get_paginated_response(serializer.data)
