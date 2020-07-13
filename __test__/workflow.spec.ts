import {readWorkflow, Step, Steps, Workflow} from "../src/workflow";
import {Either, right} from "../src/either";

describe("reading valid yaml with steps(using-action:2, running:2)", () => {
    //language=yaml
    const validYaml = `
on: [push]
jobs:
  valid-action:
    name: valid
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2

      - name: echo hello
        run: echo hello

      - name: setup go
        uses: go-community/setup-go@master

      - name: test
        run: |
          make prepare-test
          make test
    `
    it("can parse yaml to Workflow", async () => {
        const either = readWorkflow(validYaml);
        expect<Either<string, Workflow>>(either).toEqual(right({
            jobs: new Map([
                ["valid-action", [
                    { name: "checkout", uses: {
                        owner: "actions",
                        action: "checkout",
                        version: "v2"
                        } },
                    { name: "setup go", uses: {
                            owner: "go-community",
                            action: "setup-go",
                            version: "master"
                        }}
                ]]])
        }))
    })
});

describe("reading mal-format yaml", () => {
    //language=yaml
    const invalidYamlMalFormat = `
foo: test
 bar: baz
`
    it('cannot parse yaml to Workflow', function () {
        const either = readWorkflow(invalidYamlMalFormat);
        expect(either.isRight()).toBe(false);
        const failure = either.fromLeft("expected failure");
        expect(failure).toContain("invalid file contents");
    });
});

describe("reading yaml with multiple jobs(one with uses:2, another with uses: 1)", () => {
    //language=yaml
    const yaml = `
on: [push]
jobs:
  valid-action:
    name: valid
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2

      - name: echo hello
        run: echo hello

      - name: setup go
        uses: go-community/setup-go@master

      - name: test
        run: |
          make prepare-test
          make test
  another:
    name: another
    runs-on: "\${{ matrix.os }}"
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    steps:
      - name: test1
        run: echo 'test'

  final:
    name: final jobs
    needs: [valid-action, another]
    runs-on: ubuntu-latest
    if: contains(\${{ github.event.ref }}, 'master')
    steps:
      - name: checkout
        uses: actions/checkout@v2
      - name: run
        run: make build
      - uses: actions/uploadartifact@v1
        with:
          name: binary
          path: build/a.out
`
    it("can parse yaml to Workflow", async () => {
        const either = readWorkflow(yaml);
        expect<Either<string, Workflow>>(either).toEqual(right({
            jobs: new Map([
                ["valid-action", [
                    { name: "checkout", uses: {
                            owner: "actions",
                            action: "checkout",
                            version: "v2"
                        } },
                    { name: "setup go", uses: {
                            owner: "go-community",
                            action: "setup-go",
                            version: "master"
                        }}
                ]],
                ["another", []],
                ["final", [
                    { name: "checkout", uses: {
                            owner: "actions",
                            action: "checkout",
                            version: "v2"
                        } },
                    { name: "actions/uploadartifact@v1", uses: {
                            owner: "actions",
                            action: "uploadartifact",
                            version: "v1"
                        } }
                ]]
            ])
        }))
    })
});
