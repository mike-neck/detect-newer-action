# detect-newer-action
An action that detects newer actions applied to your workflow.

Inputs
===

- `exclude-actions`
    - Exclude pattern filters of action's name with regex. Multiple pattern is available via separating with a comma.
    - This parameter is optional.
    - Currently, this parameter is not working.
- `exclude-workflows`
    - Exclude pattern filters of workflow file name with regex. Multiple pattern is available via separating with a comma.
    - This parameter is optional.
- `output-file`
    - Output file name. Output file format is json. Empty or null then no output. Default empty string.
    - This parameter is optional.
- `token`
    - Github token that is able to call repo-list-tags api.(secrets.GITHUB_TOKEN)
    - Mandatory.

Outputs
===

- `diff`
    - Diff of action's version in json format.

Output json format
---

Output is an array containing the objects listed bellow.

- job : job's name.
- steps: an array of steps using older action.
    - step: name of step.
    - action: an older action.
    - usingVersion: the using version.
    - currentVersion: the newer released version.

```json
[
  {
    "job": "testing",
    "steps": [
      {
        "step": "setup node",
        "action": "actions/setup-node",
        "usingVersion": "v1.4.2",
        "currentVersion": "v2.1.0"
      }
    ]
  }
]
```

Example Usage
===

Suppose there are 2 workflow-files, `test.yml` and `release.yml`,
and you want to keep actions in `test.yml` up to date.
On the other hand, suppose you want to keep the current actions in `release.yml`.

`test.yml`

```yaml
jobs:
  testing:
    runs-on: ubuntu-latest
    steps:
      - name: setup node
        uses: actions/setup-node@v1.4.2
      - name: checkout
        uses: actions/checkout@v2

      - name: detect newer actions
        uses: mike-neck/detect-newer-action@v0.1
        id: newer-action
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          exclude-workflows: "release" # ignore release.yml
          output-file: 'build/newer-actions.json' # outputs results into file

      - name: show newer actions in json
        run: echo "${OUTPUT}" | jq '.'
        env:
          OUTPUT: ${{ steps.newer-action.outputs.diff }} # output has json format
```
