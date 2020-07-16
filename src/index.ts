import {listWorkflowFiles, readWorkflowFile} from "./io-in";
import {getInputs, Inputs} from "./inputs";
import {readWorkflow} from "./workflow";
import {InspectionJson, JobInspection, JobInspectionJson} from "./types";
import {inspectWorkflow, listTagApi} from "./inspection";
import {Both, bothBuilder} from "./both";
import {output, setError} from "./out";

run().catch(e => {
    console.error(`unexpected error: ${e}`);
    if (e instanceof Error) {
        setError(`unexpected error: ${e.name}/${e.message}`);
        console.error(e.stack);
    } else if (typeof e === "string") {
        setError(`unexpected error: ${e}`);
    } else {
        setError(`{"msg":"unexpected error","err":${JSON.stringify(e)}}`)
    }
});

async function run(): Promise<void> {
    const inputs = getInputs();
    console.info(`input: ${inputs}`)
    const both = await inspect(inputs);
    both.doLeft(message => console.warn(message))
        .doRight((result: JobInspection) => {
            result.steps
                .filter(step => step.compared().detectNew)
                .map(step => step.createLogMessage(result.job))
                .forEach(message => console.info(message));
        });
    const jobInspectionJsons = both.map<JobInspectionJson>((result: JobInspection) => {
        const inspections = result.steps
            .filter(step => step.compared().detectNew)
            .map<InspectionJson>(step => {
                return {
                    step: step.step,
                    action: `${step.owner}/${step.action}`,
                    usingVersion: step.usingVersion,
                    currentVersion: step.currentVersion
                };
            });
        return {
            job: result.job,
            steps: inspections
        };
    }).rightAll;
    return output(inputs, jobInspectionJsons);
}

async function inspect(inputs: Inputs): Promise<Both<string, JobInspection>> {
    const listTagsApi = listTagApi(inputs);

    const workflowFiles = await listWorkflowFiles();
    const builder = bothBuilder<string, JobInspection>();
    for (let workflowFile of workflowFiles) {
        if (!inputs.requireInspection(workflowFile)) {
            continue;
        }
        const contents = await readWorkflowFile(workflowFile)
        const workflows = contents.flatMap(data => readWorkflow(data));
        const inspections = await workflows.mapAsync(wf => inspectWorkflow(listTagsApi, inputs, wf));
        inspections.whenLeft((error: string) => builder.left(error))
            .whenRight(both => builder.append(both));
    }
    return Promise.resolve(builder.build());
}
