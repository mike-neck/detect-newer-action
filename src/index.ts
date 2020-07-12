import * as core from "@actions/core";
import {showPath} from "./io";

try {
    const excludes = core.getInput("exclude-actions");
    const outputFile = core.getInput("output-file");
    console.info(`excludes: ${excludes}, outputFile: ${outputFile}`)

    showPath().then(files => {
        files.forEach(file => {
            console.info(`in .github/workflows: ${file}`)
        });
    })
} catch (e) {
    core.setFailed(`error: ${e}`)
}
