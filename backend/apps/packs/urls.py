from django.urls import path

from . import views

learner_patterns = [
    path("packs/", views.pack_list, name="pack-list"),
    path("packs/mine/", views.my_packs, name="pack-mine"),
    path("packs/<int:pack_id>/start", views.pack_start, name="pack-start"),
    path("packs/<int:pack_id>/claim", views.claim_free_pack, name="pack-claim"),
    path("packs/<int:pack_id>/", views.pack_detail, name="pack-detail"),
]

admin_patterns = [
    path(
        "admin/packs/question-bank-topics/",
        views.question_bank_topics,
        name="pack-question-bank-topics",
    ),
    path("admin/packs/question-bank/", views.question_bank, name="pack-question-bank"),
    path(
        "admin/packs/<int:pack_id>/questions",
        views.admin_pack_questions,
        name="pack-questions",
    ),
    path("admin/packs/<int:pack_id>/publish", views.admin_pack_publish, name="pack-publish"),
    path(
        "admin/packs/<int:pack_id>/unpublish",
        views.admin_pack_unpublish,
        name="pack-unpublish",
    ),
    path(
        "admin/packs/<int:pack_id>/purchases",
        views.admin_pack_purchases,
        name="pack-purchases",
    ),
    path("admin/packs/<int:pack_id>/", views.admin_pack_detail, name="pack-admin-detail"),
    path("admin/packs/", views.admin_packs, name="pack-admin-list"),
]

urlpatterns = learner_patterns + admin_patterns
