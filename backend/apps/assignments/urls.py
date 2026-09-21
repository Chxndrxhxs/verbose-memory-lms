from django.urls import path

from . import views

learner_patterns = [
    path("assignments/categories/", views.catalog_tree, name="assignment-categories"),
    path("assignments/models/<int:assignment_id>/", views.model_choices, name="assignment-models"),
    path("assignments/attempts/", views.my_attempts, name="assignment-my-attempts"),
    path(
        "assignments/attempts/<int:attempt_id>/save",
        views.save_answer,
        name="assignment-save-answer",
    ),
    path(
        "assignments/attempts/<int:attempt_id>/",
        views.attempt_detail,
        name="assignment-attempt-detail",
    ),
    path(
        "assignments/transcripts/<int:assignment_id>/",
        views.transcript,
        name="assignment-transcript",
    ),
    path("assignments/<int:assignment_id>/start", views.start, name="assignment-start"),
    path("assignments/<int:assignment_id>/submit", views.submit, name="assignment-submit"),
    path("assignments/<int:assignment_id>/", views.detail, name="assignment-detail"),
    path("assignments/", views.published_list, name="assignment-list"),
]

admin_patterns = [
    path(
        "admin/assignments/generate-questions",
        views.admin_generate_questions,
        name="assignment-generate",
    ),
    path(
        "admin/assignments/extract-questions",
        views.admin_extract_questions,
        name="assignment-extract",
    ),
    path(
        "admin/assignments/regenerate-question",
        views.admin_regenerate_question,
        name="assignment-regenerate",
    ),
    path(
        "admin/assignments/regenerate-options",
        views.admin_regenerate_options,
        name="assignment-regenerate-options",
    ),
    path(
        "admin/assignments/<int:assignment_id>/structure",
        views.admin_structure,
        name="assignment-structure",
    ),
    path(
        "admin/assignments/<int:assignment_id>/publish",
        views.admin_publish,
        name="assignment-publish",
    ),
    path(
        "admin/assignments/<int:assignment_id>/unpublish",
        views.admin_unpublish,
        name="assignment-unpublish",
    ),
    path(
        "admin/assignments/<int:assignment_id>/duplicate",
        views.admin_duplicate,
        name="assignment-duplicate",
    ),
    path(
        "admin/assignments/<int:assignment_id>/attempts",
        views.admin_attempts,
        name="assignment-attempts",
    ),
    path(
        "admin/assignments/<int:assignment_id>/", views.admin_detail, name="assignment-admin-detail"
    ),
    path("admin/assignments/", views.admin_list, name="assignment-admin-list"),
    path(
        "admin/categories/<int:category_id>/",
        views.category_detail,
        name="assignment-category-detail",
    ),
    path("admin/categories/", views.categories, name="assignment-categories-admin"),
    path(
        "admin/subcategories/<int:sub_category_id>/",
        views.sub_category_detail,
        name="assignment-subcategory-detail",
    ),
    path("admin/subcategories/", views.sub_categories, name="assignment-subcategories-admin"),
    path(
        "admin/intercategories/<int:inter_category_id>/",
        views.inter_category_detail,
        name="assignment-intercategory-detail",
    ),
    path("admin/intercategories/", views.inter_categories, name="assignment-intercategories-admin"),
]

urlpatterns = learner_patterns + admin_patterns
