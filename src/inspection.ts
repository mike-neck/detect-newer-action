import {Workflow} from "./workflow";
import {Either, left, right} from "./either";
import {Inputs} from "./inputs";
import {Both, bothBuilder} from "./both";
import {Inspection, InspectionResult} from "./types";
import * as github from "@actions/github";

import {RestEndpointMethods} from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types";
import {OctokitResponse} from "@octokit/types/dist-types/OctokitResponse"
import {ReposListTagsResponseData} from "@octokit/types/dist-types/generated/Endpoints"

export interface ListTagsApi {
    call(owner: string, repo: string): Promise<Either<number, string>>
}

export function listTagApi(inputs: Inputs): ListTagsApi {
    const octokit = github.getOctokit(inputs.token) as RestEndpointMethods;
    return {
        call(owner: string, repo: string): Promise<Either<number, string>> {
            const f = async () => {
                console.debug(`owner: ${owner}, repo: ${repo}`);
                const response: OctokitResponse<ReposListTagsResponseData> = await octokit.repos.listTags({
                    owner: owner,
                    repo: repo
                });
                if (response.status < 200 || 300 <= response.status) {
                    return Promise.resolve(left<number, string>(response.status));
                }
                const data: ReposListTagsResponseData = response.data;
                if (data.length == 0) {
                    return Promise.resolve(right<number, string>(""));
                }
                const tag = data.sort((l, r) => r.name.localeCompare(l.name) )[0].name;
                return Promise.resolve(right<number, string>(tag));
            };
            return f();
        }
    }
}

async function apiCall(api: ListTagsApi, owner: string, repo: string): Promise<Either<number, string>> {
    return api.call(owner, repo)
}

export module TestOnly {
    export async function inspectWorkflowForTest(api: ListTagsApi, inputs: Inputs, workflow: Workflow): Promise<Both<string, InspectionResult>> {
        return inspectWorkflow(api, inputs, workflow)
    }
}

export async function inspectWorkflow(api: ListTagsApi, inputs: Inputs, workflow: Workflow): Promise<Both<string, InspectionResult>> {
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
            result.whenLeft(message => builder.left(message))
                .whenRight(inspection => inspections.push(inspection));
        }
        builder.right({job: jobName, steps: inspections});
    }
    return builder.build();
}
