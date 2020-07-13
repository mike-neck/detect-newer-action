import * as core from "@actions/core"

export interface Inputs {
    outputFilePath: string | null
    excludeActions: string[]

    requireInspection(workflowFile: WorkflowFile): boolean
}

interface InputGetter {
    getInput(name): string | null
}

export function getInputs(): Inputs {
    return getInputFrom({
        getInput(name): string | null {
            return core.getInput(name);
        }
    });
}

function getInputFrom(getter: InputGetter): Inputs {
    const o = getter.getInput("output-file");
    const outputFilePath = o == null? null: o.trim().length == 0? null: o.trim();

    const ea = getter.getInput("exclude-actions");
    const exAction = ea == null? "": ea.trim().length == 0? "": ea.trim();
    const excludeActions = exAction.split(",");

    const ew = getter.getInput("exclude-workflows");
    const exWork = ew == null? "": ew.trim();
    const excludeWorkflows = exWork.split(",");

    return new InputsImpl(outputFilePath, excludeActions, excludeWorkflows);
}

export module TestingOnly {
    export function inputs(outputFilePath: string | null, excludeActions: string[], excludeWorkflows: string[]): Inputs {
        return new InputsImpl(outputFilePath, excludeActions, excludeWorkflows);
    }
}

class InputsImpl implements Inputs {

    readonly excludeActions: string[];
    readonly excludeWorkflows: string[];
    readonly outputFilePath: string | null;

    constructor(outputFilePath: string | null, excludeActions: string[], excludeWorkflows: string[]) {
        this.outputFilePath = outputFilePath;
        this.excludeActions = excludeActions;
        this.excludeWorkflows = excludeWorkflows;
    }

    requireInspection(workflowFile: WorkflowFile): boolean {
        for (let excludeWorkflow of this.excludeWorkflows) {
            if (workflowFile.name.match(RegExp(excludeWorkflow))) {
                return false;
            }
        }
        return true;
    }
}
