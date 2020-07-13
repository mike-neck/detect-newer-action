import * as fs from "fs";
import {Either, left, right} from "./either";
import * as ioutil from "@actions/io/lib/io-util";
import {WorkflowFile} from "./types";

export async function listWorkflowFiles(): Promise<WorkflowFile[]> {
    const files = await ioutil.readdir(".github/workflows");
    return  files.map(name => {
        return { name: name, asPath: `.github/workflows/${name}` };
    });
}

export async function readWorkflowFile(file: WorkflowFile): Promise<Either<string, string>> {
    return new Promise<Either<string, string>>((success, _) => {
        fs.readFile(
            file.asPath,
            {encoding: "utf-8"},
            ((err, data) => {
                if (err != null) {
                    success(left(err.message));
                } else {
                    success(right(data));
                }
            }));
    });
}
