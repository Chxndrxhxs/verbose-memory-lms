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


@pytest.mark.django_db
def test_duplicate_names_at_every_level_are_rejected(instructor_client, inter_category):
    cat = inter_category.sub_category.category
    r = instructor_client.post(
        "/api/v1/admin/categories/", {"name": cat.name.upper()}, format="json"
    )
    assert r.status_code == 400
    assert "already exists" in str(r.json())

    r = instructor_client.post(
        "/api/v1/admin/subcategories/",
        {"name": inter_category.sub_category.name.upper(), "category_id": cat.id},
        format="json",
    )
    assert r.status_code == 400
    assert "already exists" in str(r.json())

    r = instructor_client.post(
        "/api/v1/admin/intercategories/",
        {
            "name": inter_category.name.upper(),
            "sub_category_id": inter_category.sub_category.id,
        },
        format="json",
    )
    assert r.status_code == 400
    assert "already exists" in str(r.json())


@pytest.mark.django_db
def test_rename_to_a_taken_name_is_rejected(instructor_client, instructor, inter_category):
    other = Category.objects.create(name="Other", created_by=instructor)
    r = instructor_client.patch(
        f"/api/v1/admin/categories/{other.id}/",
        {"name": inter_category.sub_category.category.name},
        format="json",
    )
    assert r.status_code == 400
    assert "already exists" in str(r.json())

    twin = SubCategory.objects.create(
        name="Chemistry",
        category=inter_category.sub_category.category,
        created_by=instructor,
    )
    r = instructor_client.patch(
        f"/api/v1/admin/subcategories/{inter_category.sub_category.id}/",
        {"name": twin.name.upper()},
        format="json",
    )
    assert r.status_code == 400

    inter_twin = InterCategory.objects.create(
        name="JEE Advanced",
        sub_category=inter_category.sub_category,
        created_by=instructor,
    )
    r = instructor_client.patch(
        f"/api/v1/admin/intercategories/{inter_category.id}/",
        {"name": inter_twin.name.upper()},
        format="json",
    )
    assert r.status_code == 400
