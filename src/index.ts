import * as core from "@actions/core";
import {listWorkflowFiles, readWorkflowFile} from "./io";
import {getInputs, Inputs} from "./inputs";
import {Either, right} from "./either";
import {readWorkflow} from "./workflow";

try {
    const excludes = core.getInput("exclude-actions");
    const outputFile = core.getInput("output-file");
    console.info(`excludes: ${excludes}, outputFile: ${outputFile}`)

    listWorkflowFiles().then(files => {
        files.forEach(file => {
            console.info(`in .github/workflows: ${file}`)
        });
    })
} catch (e) {
    core.setFailed(`error: ${e}`)
}

async function run(): Promise<void> {
    const inputs = getInputs();
    console.info(`input: ${inputs}`)
    const workflowFiles = await listWorkflowFiles();
    new Promise( async (success, failure) => {
        for (let workflowFile of workflowFiles) {
            if (!inputs.requireInspection(workflowFile)) {
                continue;
            }
            const contents = await readWorkflowFile(workflowFile);
            if (!contents.isRight()) {
                failure(contents.fromLeft("fail"))
                return;
            }

        }
    })
}

async function ioOperation(inputs: Inputs): Promise<Either<string[], InspectionResult[]>> {
    const workflowFiles = await listWorkflowFiles();
    const result = new Array<InspectionResult>();
    const failures = new Array<string>();
    for (let workflowFile of workflowFiles) {
        if (!inputs.requireInspection(workflowFile)) {
            continue;
        }
        const contents = await readWorkflowFile(workflowFile)
        const workflow = contents.flatMap(data => readWorkflow(data));

    }
}
