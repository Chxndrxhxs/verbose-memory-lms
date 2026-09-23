import pytest

from apps.assignments.models import Category, InterCategory, SubCategory


@pytest.mark.django_db
def test_instructor_creates_three_levels(instructor_client):
    before_categories = Category.objects.count()
    before_subs = SubCategory.objects.count()
    before_inters = InterCategory.objects.count()
    r = instructor_client.post("/api/v1/admin/categories/", {"name": "Commerce"}, format="json")
    assert r.status_code == 200
    cat_id = r.json()["data"]["id"]

    r = instructor_client.post(
        "/api/v1/admin/subcategories/", {"name": "Accounts", "category_id": cat_id}, format="json"
    )
    assert r.status_code == 200
    sub_id = r.json()["data"]["id"]

    r = instructor_client.post(
        "/api/v1/admin/intercategories/",
        {"name": "CA Foundation", "sub_category_id": sub_id},
        format="json",
    )
    assert r.status_code == 200
    assert r.json()["data"]["name"] == "CA Foundation"
    assert Category.objects.count() == before_categories + 1
    assert SubCategory.objects.count() == before_subs + 1
    assert InterCategory.objects.count() == before_inters + 1


@pytest.mark.django_db
def test_learner_cannot_manage_hierarchy(learner_client, inter_category):
    r = learner_client.post("/api/v1/admin/categories/", {"name": "X"}, format="json")
    assert r.status_code == 403
    r = learner_client.patch(
        f"/api/v1/admin/categories/{inter_category.sub_category.category_id}/",
        {"is_active": False},
        format="json",
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_deactivate_hides_from_catalog(learner_client, instructor_client, inter_category):
    before = len(learner_client.get("/api/v1/assignments/categories/").json()["data"])
    instructor_client.patch(
        f"/api/v1/admin/categories/{inter_category.sub_category.category_id}/",
        {"is_active": False},
        format="json",
    )
    r = learner_client.get("/api/v1/assignments/categories/")
    assert len(r.json()["data"]) == before - 1


@pytest.mark.django_db
def test_patch_updates_and_toggles(instructor_client, inter_category):
    sub_id = inter_category.sub_category_id
    r = instructor_client.patch(
        f"/api/v1/admin/subcategories/{sub_id}/", {"position": 7}, format="json"
    )
    assert r.status_code == 200
    assert r.json()["data"]["position"] == 7
    r = instructor_client.patch(
        f"/api/v1/admin/subcategories/{sub_id}/", {"is_active": False}, format="json"
    )
    assert r.json()["data"]["is_active"] is False
