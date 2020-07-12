import * as core from "@actions/core"

export interface Inputs {
    outputFilePath: string | null
    excludeActions: string[]
    excludeWorkflows: string[]
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

    return {
        outputFilePath: outputFilePath,
        excludeActions: excludeActions,
        excludeWorkflows: excludeWorkflows
    };
}
