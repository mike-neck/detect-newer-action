import {Either, left, right} from "./either";
import * as yaml from "js-yaml";
import {YAMLException} from "js-yaml";

export interface Workflow {
    jobs: Map<string, Steps>
}

export type Steps = Step[]

export interface Step {
    name: string
    uses: Action
}

export module TestOnly {
    export function releasedAction(owner: string, action: string, version: string): Action {
        return new ReleasedAction(owner, action, version);
    }
}

export interface InspectionUnavailableAction {
    owner: null
    action: string
    version: null

    apiUnavailableReason: string
}

export interface InspectionAvailableAction {
    owner: string
    action: string
    version: string

    apiUnavailableReason: null
}

export type Action = InspectionUnavailableAction | InspectionAvailableAction

interface YamlReader {
    read(data: string): string | object | undefined
}

export function readWorkflow(data: string): Either<string, Workflow> {
    return readWorkflowByReader(data, {
        read(data: string): string | object | undefined {
            try {
                return yaml.safeLoad(data);
            } catch (e) {
                left((e as YAMLException).message)
            }
        }
    })
}

function readWorkflowByReader(data: string, reader: YamlReader): Either<string, Workflow> {
    const wf = reader.read(data);
    if (!isObject(wf)) {
        return left(`invalid file contents: ${wf}`);
    }
    const either: Either<string, Jobs> = fetchJobs(wf);
    const stringToStepsMap = either.map((jobs: Jobs) => {
        const m = new Map<string, Steps>();
        for (let [name, job] of jobs) {
            const steps = job.steps.map(task => task.toStep());
            m.set(name, steps);
        }
    return m;
    });
    return stringToStepsMap.map((m: Map<string, Steps>) => {
        return  { jobs: m };
    });
}

function isObject(something: string | object | undefined): something is object {
    return typeof something === "object";
}

function fetchJobs(obj: object): Either<string, Jobs> {
    const wfs = Object.keys(obj).map(key => {
        if (key == "jobs") {
            return obj as Wf;
        } else {
            return null;
        }
    }).filter(wfOrNull => wfOrNull != null)
        .map(wf => wf as Wf);
    if (wfs.length != 1) {
        return  left("invalid definition/multiple jobs detected");
    }
    const wf = wfs[0];
    if (!jobsIsObject(wf.jobs)) {
        return left("invalid definition/jobs is not object");
    }
    const jobObjects: object = wf.jobs;
    const uj = unsafeJobs(jobObjects);
    const jobs: Jobs = new Map<string, Job>();
    for (let [jobName, unsafe] of uj.entries()) {
        const job = toJob(unsafe);
        if (job != null) {
            jobs.set(jobName, job);
        }
    }
    return right(jobs);
}

type Jobs = Map<string, Job>

interface Wf {
    jobs: object | any
}

function jobsIsObject(obj: object | any): obj is object {
    return typeof obj == "object";
}

function unsafeJobs(obj: object): Map<string, UnsafeJob> {
    return  Object.keys(obj)
        .map(key => [key, obj[key]] as [string, any])
        .filter(([_, value]) => hasSteps(value))
        .map(([key, value]) => [key, value as UnsafeJob] as [string, UnsafeJob])
        .reduce((m: Map<string, UnsafeJob>, [k, v]) => m.set(k, v), new Map());
}

function hasSteps(obj: any): boolean {
    if (typeof obj != "object") {
        return false;
    }
    return Object.keys(obj as object)
        .filter(key => key == "steps")
        .length > 0;
}

interface UnsafeJob {
    steps: object[] | any
}

function toJob(unsafeJob: UnsafeJob): Job | null {
    if (!Array.isArray(unsafeJob.steps)) {
        return null;
    }
    const steps = unsafeJob.steps as any[];
    const tasks = steps.map(toTask)
        .filter(it => it != null)
        .map(it => it as Task);
    return {
        steps: tasks
    };
}

interface Job {
    steps: Task[]
}

function toTask(obj: any): Task | null {
    if (typeof obj !== "object") {
        return null;
    }
    const o = obj as object;
    const candidate = Object.keys(o)
        .map(key => [key, o[key]] as [string, any])
        .filter(([k, _]) => k === "name" || k === "uses")
    if (candidate.length < 1 || 2 < candidate.length) {
        return null;
    }
    const task = candidate.reduce((m: Map<string, any>, [k, v]) => m.set(k, v), new Map());
    const name = task.get("name");
    const uses = task.get("uses");
    if (uses == null) {
        return null;
    }
    const action = mkAction(uses);
    return {
        toStep(): Step {
            return {
                name: name == null? uses: name,
                uses: action
            };
        }
    };
}

interface Task {
    toStep(): Step
}

// TODO There are docker type actions.
// TODO There are actions specified by a commit hash.
// TODO There
function mkAction(uses: string): Action {
    if (uses.indexOf("/") === -1) {
        return new LocalAction(uses);
    }
    const [owner, actionWithVersion] = uses.split("/");
    if (actionWithVersion.indexOf("@") === -1) {
        return new LocalAction(uses);
    }
    const [action, version] =  actionWithVersion.split("@");
    if (version.length === 0) {
        return new LocalAction(uses);
    }
    return new ReleasedAction(owner, action, version);
}

class LocalAction implements InspectionUnavailableAction {
    readonly owner = null;
    readonly action: string;
    readonly version = null;

    constructor(action: string) {
        this.action = action;
    }

    apiUnavailableReason: string = `${this.action} is local action`;
}

class ReleasedAction implements InspectionAvailableAction {
    readonly action: string;
    readonly owner: string;
    readonly version: string;

    constructor(owner: string, action: string, version: string) {
        this.action = action;
        this.owner = owner;
        this.version = version;
    }

    apiUnavailableReason: null = null;
}
