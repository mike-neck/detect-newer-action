import * as core from "@actions/core";
import {listWorkflowFiles, readWorkflowFile} from "./io";
import {getInputs, Inputs} from "./inputs";
import {Either, right} from "./either";
import {readWorkflow} from "./workflow";
import {InspectionResult} from "./types";
import {inspectWorkflow, listTagApi} from "./inspection";
import {Both, bothBuilder} from "./both";

run().catch(e => console.error(`unexpected error: ${e}`));

async function run(): Promise<void> {
    const inputs = getInputs();
    console.info(`input: ${inputs}`)
    const both = await inspect(inputs);
    both.doLeft(message => console.warn(`error: ${message}`))
        .doRight((result: InspectionResult) => {
            result.steps.filter(step => step.currentVersion !== step.usingVersion)
                .forEach(step => {
                    console.info(`update detected: job=${result.job}, step=${step.step}, action=${step.owner}/${step.action}, current-version=${step.currentVersion}, using-version=${step.usingVersion}`)
                });
        });
}

async function inspect(inputs: Inputs): Promise<Both<string, InspectionResult>> {
    const listTagsApi = listTagApi(inputs);

    const workflowFiles = await listWorkflowFiles();
    const builder = bothBuilder<string, InspectionResult>();
    for (let workflowFile of workflowFiles) {
        if (!inputs.requireInspection(workflowFile)) {
            continue;
        }
        const contents = await readWorkflowFile(workflowFile)
        const workflows = contents.flatMap(data => readWorkflow(data));
        const inspection = await workflows.mapAsync(wf => inspectWorkflow(listTagsApi, inputs, wf));
        inspection.whenLeft((error: string) => builder.left(error))
            .whenRight(both => builder.append(both));
    }
    return Promise.resolve(builder.build());
}
