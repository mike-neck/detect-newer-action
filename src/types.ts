export interface WorkflowFile {
    name: string
    asPath: string
}

export interface JobInspection {
    job: string
    steps: Inspection[]
}

export interface Inspection {
    step: string
    owner: string
    action: string
    usingVersion: string
    currentVersion: string

    createLogMessage(job: string): string

    compared(): ComparisonResult
}

export interface ComparisonResult {
    detectNew: boolean

    usingVersion: string
    currentVersion: string

    asString: string
}

export function inspection(action: string, owner: string, step: string, currentVersion: string, usingVersion: string): Inspection {
    return new InspectionImpl(action, owner, step, currentVersion, usingVersion);
}

export interface JobInspectionJson {
    job: string
    steps: InspectionJson[]
}

export interface InspectionJson {
    step: string
    action: string
    usingVersion: string
    currentVersion: string
}

class InspectionImpl implements Inspection {
    action: string;
    owner: string;
    step: string;

    currentVersion: string;
    usingVersion: string;

    constructor(action: string, owner: string, step: string, currentVersion: string, usingVersion: string) {
        this.action = action;
        this.owner = owner;
        this.step = step;
        this.currentVersion = currentVersion;
        this.usingVersion = usingVersion;
    }

    compared(): ComparisonResult {
        const detectNew = this.usingVersion < this.currentVersion;
        return new ComparisonResultImpl(detectNew, this.currentVersion, this.usingVersion);
    }

    createLogMessage(job: string): string {
        return `update detected: job=${job}, step=${this.step}, action=${this.owner}/${this.action}, current-version=${this.currentVersion}, using-version=${this.usingVersion}`;
    }
}

class ComparisonResultImpl implements ComparisonResult {

    readonly detectNew: boolean;

    readonly currentVersion: string;
    readonly usingVersion: string;

    constructor(detectNew: boolean, currentVersion: string, usingVersion: string) {
        this.detectNew = detectNew;
        this.currentVersion = currentVersion;
        this.usingVersion = usingVersion;
    }

    get asString(): string {
        return `current=${this.currentVersion}, using=${this.usingVersion}`;
    }
}
