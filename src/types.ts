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

    result(): ComparisonResult
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

    result(): ComparisonResult {
        const detectNew = this.usingVersion < this.currentVersion;
        return new ComparisonResultImpl(detectNew, this.currentVersion, this.usingVersion);
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
