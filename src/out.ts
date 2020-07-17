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
            console.info(`creating dir ${directory} by ${err?.name} ${err?.code}, ${err?.message}`);
            if (err && err.code == "ENOENT") fs.mkdir(directory, (e) => {
                console.info(`creating directory failed ${directory} by ${e?.name} ${e?.code} ${e?.message}`);
                failure(e);
            });
        });
        console.info(`write file ${outputFilePath}`);
        fs.writeFile(outputFilePath, json, { encoding: "utf-8" }, err => {
            console.info(`creating directory failed ${outputFilePath} by ${err?.name} ${err?.code} ${err?.message}`);
            failure(err);
        });
    });
}

function setOutput(json: string) {
    core.setOutput("diff", json);
}

export function setError(e: string) {
    core.setFailed(`unexpected error: ${e}`);
}
