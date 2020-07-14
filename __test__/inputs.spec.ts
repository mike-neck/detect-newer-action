import { TestingOnly } from "../src/inputs";

describe("no excludeWorkflows", () => {
    const inputs = TestingOnly.inputs(null, [], [], "");

    it("always require inspection", () => {
        for (const fileName of ["foo.yml", "bar.yml", "baz.yml", "", "qux-quux.yml"]) {
            const workflowFile = { name: fileName, asPath: `.github/workflows/${fileName}` };
            expect(inputs.requireInspection(workflowFile)).toBe(true);
        }
    });
});

describe("single excludeWorkflows spec", () => {
    const inputs = TestingOnly.inputs(null, [], [
        //language=regexp
        "[a-zA-Z0-9]+-[a-zA-Z0-9]+"
    ], "");

    it('should return false, if it matches pattern', () => {
        for (const fileName of ["test-workflow.yml", "example1-1.yml", "1-a.yml"]) {
            const workflowFile = { name: fileName, asPath: `.github/workflows/${fileName}` };
            expect(inputs.requireInspection(workflowFile)).toBe(false);
        }
    });

    it('should return true, if it does not match pattern', () => {
        for (const fileName of ["foo.yml", "bar.yml", "baz.yml", ""]) {
            const workflowFile = { name: fileName, asPath: `.github/workflows/${fileName}` };
            expect(inputs.requireInspection(workflowFile)).toBe(true);
        }
    });
});
