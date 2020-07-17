import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import {JobInspectionJson} from "./types";
import {Inputs} from "./inputs";

export async function output(inputs: Inputs, jobInspections: JobInspectionJson[]): Promise<void> {
    const json = JSON.stringify(jobInspections);
    await writeJsonFileIfRequired(inputs, json)
    setOutput(json);
}

async function writeJsonFileIfRequired(inputs: Inputs, json: string): Promise<void> {
    const outputFilePath = inputs.outputFilePath;
    if (outputFilePath == null) {
        return Promise.resolve();
    }
    return new Promise((success, failure) => {
        console.info(`output file ${outputFilePath}`);
        const directory = path.join(outputFilePath, "..");
        fs.stat(directory, (err, _) => {
            if (err && err.code == "ENOENT") fs.mkdir(directory, errorOnCreatingDirectory(directory, failure));
        });
        console.info(`write file ${outputFilePath}`);
        fs.writeFile(outputFilePath, json, { encoding: "utf-8" }, errorOnWritingJsonFile(outputFilePath, failure));
    });
}

function setOutput(json: string) {
    core.setOutput("diff", json);
}

export function setError(e: string) {
    core.setFailed(`unexpected error: ${e}`);
}

const errorOnCreatingDirectory: (directory: string, failure: (p?: any) => void) => (err: NodeJS.ErrnoException | null) => void =
    (directory, failure) =>
        err =>
            failure(`error: creating directory[${directory}] by ${err?.code} ${err?.name} ${err?.message}`);

const errorOnWritingJsonFile: (outputFilePath: string, failure: (p?: any) => void) => (err: NodeJS.ErrnoException | null) => void =
    (outputFilePath, failure) =>
        err =>
            failure(`error: writing json file[${outputFilePath}] by ${err?.code} ${err?.name} ${err?.message}`);
