import {Workflow} from "./workflow";
import {Either} from "./either";
import * as github from "@actions/github"
import {Inputs} from "./inputs";
import { Octokit } from "@octokit/rest"
import {OctokitResponse} from "@octokit/types/dist-types/OctokitResponse";
import {ReposListTagsResponseData} from "@octokit/types/dist-types/generated/Endpoints";
import {Both, bothBuilder} from "./both";
import {Inspection, InspectionResult} from "./types";

interface ListTagsApi {
    call(owner: string, repo: string): Promise<Either<number, string>>
}

async function apiCall(api: ListTagsApi, owner: string, repo: string): Promise<Either<number, string>> {
    return api.call(owner, repo)
}

export module TestOnly {
    export function inspectWorkflowForTest(api: ListTagsApi, inputs: Inputs, workflow: Workflow) {
        return inspectWorkflow(api, inputs, workflow)
    }
}

async function inspectWorkflow(api: ListTagsApi, inputs: Inputs, workflow: Workflow): Promise<Both<string, InspectionResult>> {
    const builder = bothBuilder<string, InspectionResult>();
    for (let [jobName, steps] of workflow.jobs) {
        const inspections = new Array<Inspection>();
        for (let step of steps) {
            const action = step.uses;
            if (action.owner == null) {
                continue;
            }
            const either = await apiCall(api, action.owner, action.action);
            const result: Either<string, Inspection> = either.map(tag => { return {
                step: step.name,
                owner: step.uses.owner === null? "": step.uses.owner,
                action: step.uses.action,
                currentVersion: tag,
                usingVersion: step.uses.version === null ? "": step.uses.version
            }; }).mapLeft(status =>
                `http status: ${status} for job: ${jobName}, step: ${step.name}, action: ${step.uses.owner}/${step.uses.action}`);
            either.whenLeft(message => builder.left(message))
                .whenRight(inspection => inspections.push(inspection));
        }
        builder.right({job: jobName, steps: inspections});
    }
    return builder.build();
}
