import pytest

from apps.assignments.models import AssignmentModel, AssignmentModelStep
from apps.assignments.services import model_duration_seconds, node_duration_seconds


@pytest.mark.django_db
def test_sequential_durations_sum(assignment_factory):
    assignment = assignment_factory()
    model1 = assignment.models.get(code="Model 1")
    model2 = assignment.models.get(code="Model 2")
    assert model_duration_seconds(model1) == 600
    assert model_duration_seconds(model2) == 300 + 200


@pytest.mark.django_db
def test_parallel_duration_takes_max(assignment_factory):
    assignment = assignment_factory()
    parallel = AssignmentModel.objects.create(
        assignment=assignment,
        code="Model P",
        name="Parallel",
        execution_mode=AssignmentModel.ExecutionMode.PARALLEL,
    )

    AssignmentModelStep.objects.create(model=parallel, kind="test", name="T1", duration_seconds=300)
    AssignmentModelStep.objects.create(model=parallel, kind="test", name="T2", duration_seconds=450)
    assert model_duration_seconds(parallel) == 450


@pytest.mark.django_db
def test_leaf_steps_have_own_duration(assignment_factory):
    assignment = assignment_factory()
    model1 = assignment.models.get(code="Model 1")
    step = model1.steps.get()
    assert node_duration_seconds(step) == 600


@pytest.mark.django_db
def test_step_children_sum_in_sequential(assignment_factory):
    assignment = assignment_factory()
    model = AssignmentModel.objects.create(assignment=assignment, code="M3", name="Model 3")
    test = AssignmentModelStep.objects.create(
        model=model, kind="test", name="T", duration_seconds=100
    )
    AssignmentModelStep.objects.create(
        model=model, kind="set", name="S1", duration_seconds=40, parent=test
    )
    AssignmentModelStep.objects.create(
        model=model, kind="set", name="S2", duration_seconds=35, parent=test
    )
    assert node_duration_seconds(test) == 75
