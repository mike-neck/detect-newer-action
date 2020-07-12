import * as core from "@actions/core";

try {
    const excludes = core.getInput("excludes");
    const outputFile = core.getInput("output-file");
    console.info(`excludes: ${excludes}, outputFile: ${outputFile}`)
} catch (e) {
    core.setFailed(`error: ${e}`)
}
