import pytest


@pytest.mark.django_db
def test_published_only_in_catalog(learner_client, assignment_factory):
    assignment = assignment_factory(title="Hidden")
    assignment.status = "published"
    assignment.published_at = assignment.updated_at
    assignment.save(update_fields=["status", "published_at"])

    draft = assignment_factory(title="Draft Only")

    r = learner_client.get("/api/v1/assignments/")
    assert r.status_code == 200
    titles = [a["title"] for a in r.json()["data"]]
    assert "Hidden" in titles
    assert "Draft Only" not in titles

    r = learner_client.get(f"/api/v1/assignments/{draft.id}/")
    assert r.status_code == 404


@pytest.mark.django_db
def test_catalog_filters(learner_client, assignment_factory):
    a = assignment_factory(title="Waves")
    a.status = "published"
    a.save(update_fields=["status"])
    a2 = assignment_factory(title="Optics")
    a2.status = "published"
    a2.save(update_fields=["status"])

    r = learner_client.get(f"/api/v1/assignments/?inter_category={a.inter_category_id}")
    assert len(r.json()["data"]) == 2
    r = learner_client.get("/api/v1/assignments/?q=Waves")
    assert [x["title"] for x in r.json()["data"]] == ["Waves"]


@pytest.mark.django_db
def test_detail_exposes_models_preview(learner_client, assignment_factory):
    assignment = assignment_factory(title="Preview")
    assignment.status = "published"
    assignment.save(update_fields=["status"])

    r = learner_client.get(f"/api/v1/assignments/{assignment.id}/")
    payload = r.json()["data"]
    assert payload["duration_seconds"] == 600
    assert payload["duration_label"] == "10m"
    assert len(payload["models_preview"]) == 2
    assert payload["models_preview"][0]["duration_seconds"] == 600

    r = learner_client.get(f"/api/v1/assignments/models/{assignment.id}/")
    models = r.json()["data"]
    assert len(models) == 2
    assert models[0]["execution_mode"] == "sequential"


@pytest.mark.django_db
def test_catalog_tree_counts(learner_client, assignment_factory, inter_category):
    assignment = assignment_factory(title="Counted")
    assignment.status = "published"
    assignment.save(update_fields=["status"])
    assignment_factory(title="Not Published")

    r = learner_client.get("/api/v1/assignments/categories/")
    tree = r.json()["data"]
    inter = tree[0]["subcategories"][0]["intercategories"][0]
    assert inter["assignments_count"] == 1
