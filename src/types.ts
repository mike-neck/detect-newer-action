export interface WorkflowFile {
    name: string
    asPath: string
}

export interface InspectionResult {
    job: string
    steps: Inspection[]
}

export interface Inspection {
    step: string
    owner: string
    action: string
    usingVersion: string
    currentVersion: string
}
