import {inspection} from "../src/types";

describe("inspection with old version=v2, new version=v2", () => {

    const ins = inspection("test", "user", "running-test", "v2", "v2");

    it('should be false when get detectNew from ComparisonResult', function () {
        const result = ins.compared();
        expect(result.detectNew).toBe(false);
    });
});

describe("inspection with old version=v2, new version=v2.1", () => {

    const ins = inspection("test", "user", "running-test", "v2", "v2");

    it('should be false when get detectNew from ComparisonResult', function () {
        const result = ins.compared();
        expect(result.detectNew).toBe(false);
    });
});

describe("inspection with old version=v2, new version=v3", () => {

    const ins = inspection("test", "user", "running-test", "v3", "v2");

    it('should be true when get detectNew from ComparisonResult', function () {
        const result = ins.compared();
        expect(result.detectNew).toBe(true);
    });
});

describe("inspection with old version=v2.1.2, new version=v2.1.3", () => {

    const ins = inspection("test", "user", "running-test", "v3", "v2");

    it('should be true when get detectNew from ComparisonResult', function () {
        const result = ins.compared();
        expect(result.detectNew).toBe(true);
    });
});
