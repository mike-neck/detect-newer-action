import exp from "constants";

export interface Either<L, R> {
    isRight(): boolean;
    map<N>(mapping: (R) => N): Either<L, N>
    flatMap<N>(mapping: (R) => Either<L, N>): Either<L, N>
    mapLeft<E>(mapping: (L) => E): Either<E, R>
    fromRight(defaultValue: R): R
    fromLeft(defaultValue: L): L

    whenLeft(leftConsumer: (L) => void): EitherRightConsumption<R>;
}

export interface EitherRightConsumption<R> {
    whenRight(rightConsumer: (R) => void);
}

class Left<L, R> implements Either<L, R>{

    private readonly value: L;

    constructor(value: L) {
        this.value = value
    }

    flatMap<N>(mapping: (R) => Either<L, N>): Either<L, N> {
        return new Left<L, N>(this.value);
    }

    isRight(): boolean {
        return false;
    }

    map<N>(mapping: (R) => N): Either<L, N> {
        return new Left<L, N>(this.value);
    }

    mapLeft<E>(mapping: (L) => E): Either<E, R> {
        return new Left<E, R>(mapping(this.value));
    }

    fromRight(defaultValue: R): R {
        return defaultValue;
    }

    fromLeft(defaultValue: L): L {
        return this.value;
    }

    whenLeft(leftConsumer: (L) => void): EitherRightConsumption<R> {
        const l = this.value;
        return {
            whenRight(rightConsumer: (R) => void) {
                leftConsumer(l);
            }
        };
    }
}

class Right<L, R> implements Either<L, R>{

    private readonly value: R

    constructor(value: R) {
        this.value = value
    }

    flatMap<N>(mapping: (R) => Either<L, N>): Either<L, N> {
        return mapping(this.value)
    }

    isRight(): boolean {
        return true;
    }

    map<N>(mapping: (R) => N): Either<L, N> {
        return new Right<L, N>(mapping(this.value));
    }

    mapLeft<E>(mapping: (L) => E): Either<E, R> {
        return new Right<E, R>(this.value);
    }

    fromRight(defaultValue: R): R {
        return this.value;
    }

    fromLeft(defaultValue: L): L {
        return defaultValue;
    }

    whenLeft(leftConsumer: (L) => void): EitherRightConsumption<R> {
        const r = this.value;
        return {
            whenRight(rightConsumer: (R) => void) {
                rightConsumer(r);
            }
        };
    }
}

export function left<L, R>(value: L): Either<L, R> {
    return new Left<L, R>(value)
}

export function right<L, R>(value: R): Either<L, R> {
    return new Right<L, R>(value)
}
