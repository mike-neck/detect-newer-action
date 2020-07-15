import {Inputs} from "../src/inputs";
import {JobInspection, WorkflowFile} from "../src/types";
import {Steps, TestOnly, Workflow} from "../src/workflow";
import {InspectionTestOnly, ListTagsApi} from "../src/inspection";
import {Either, left, right} from "../src/either";
import {fail} from "assert";
import inspectWorkflowForTest = InspectionTestOnly.inspectWorkflowForTest;
import releasedAction = TestOnly.releasedAction;

const InspectionSpecData = {
    workflow: {
        jobs: new Map<string, Steps>(
            [["test", [
                {
                    name: "step-1",
                    uses: releasedAction(
                        "user",
                        "setup",
                        "v1")
                }, {
                    name: "step-2",
                    uses: releasedAction(
                        "actions",
                        "upload",
                        "v2")
                }
            ]], [
                "release", [
                    {
                        name: "step-3",
                        uses: releasedAction(
                            "user",
                            "setup",
                            "v1")
                    }
                ]
            ]
            ]
        )
    }
}

describe("api returns no error", () => {
    const inputs: Inputs = {
        excludeActions: [],
        outputFilePath: "result",
        requireInspection(workflowFile: WorkflowFile): boolean {
            return true;
        },
        token: ""
    }

    const workflow: Workflow = InspectionSpecData.workflow;
    const api: ListTagsApi = {
        call(owner: string, repo: string): Promise<Either<number, string>> {
            return Promise.resolve(right("v2"));
        }
    }

    it('should contain an inspections the same count as workflows', async function() {
        const both = await inspectWorkflowForTest(api, inputs, workflow);
        expect(both.leftCount).toBe(0);
        expect(both.rightCount).toBe(2);
        both.doLeft(msg => { fail(msg) })
            .doRight((result: JobInspection) => {
                result.steps.forEach(ins => {
                    expect(ins.currentVersion).toBe("v2");
                });
            });
    });
});

describe("api returns error 1 of 3 actions", () => {
    const inputs: Inputs = {
        excludeActions: [],
        outputFilePath: "result",
        requireInspection(workflowFile: WorkflowFile): boolean {
            return true;
        },
        token: ""
    }

    const workflow: Workflow = InspectionSpecData.workflow;

    const api: ListTagsApi = {
        call(owner: string, repo: string): Promise<Either<number, string>> {
            if (owner === "actions") {
                return Promise.resolve(left(400));
            } else {
                return Promise.resolve(right("v2"));
            }
        }
    }


    it('should contain 2 success and 1 error', async function() {
        const both = await inspectWorkflowForTest(api, inputs, workflow);
        expect(both.leftCount).toBe(1);
        expect(both.rightCount).toBe(2);

        both.doLeft(msg => {
            expect(msg).toContain("400");
            expect(msg).toContain("action: actions/upload");

        }).doRight((result: JobInspection) => {
            result.steps.forEach(ins => {
                expect(ins.currentVersion).toBe("v2");
            });
        });
    });
});

describe("api returns reject", () => {
    const inputs: Inputs = {
        excludeActions: [],
        outputFilePath: "result",
        requireInspection(workflowFile: WorkflowFile): boolean {
            return true;
        },
        token: ""
    }

    const workflow: Workflow = InspectionSpecData.workflow;

    const api: ListTagsApi = {
        call(owner: string, repo: string): Promise<Either<number, string>> {
            return Promise.reject("error")
        }
    }

    it('should propagate error', async () => {
        const promise = inspectWorkflowForTest(api, inputs, workflow);
        const finish = promise.then(s => { fail(`not expect success: ${s}`) })
            .catch(e => { expect(e).toBe("error") });
        await finish;
    });
});
