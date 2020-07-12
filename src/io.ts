import * as fs from "fs";
import { Either, left, right } from "./either";
import * as github from "@actions/github";
import * as core from "@actions/core";
import * as iou from "@actions/io/lib/io-util";

export async function showPath(): Promise<string[]> {
    return iou.readdir(".github/workflows")
}
