export interface Either<L, R> {
    isRight(): boolean;
    map<N>(mapping: (R) => N): Either<L, N>
    flatMap<N>(mapping: (R) => Either<L, N>): Either<L, N>
    mapLeft<E>(mapping: (L) => E): Either<E, R>
    right(defaultValue: R): R
    left(defaultValue: L): L
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

    right(defaultValue: R): R {
        return defaultValue;
    }

    left(defaultValue: L): L {
        return this.value;
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

    right(defaultValue: R): R {
        return this.value;
    }

    left(defaultValue: L): L {
        return defaultValue;
    }
}

export function left<L, R>(value: L): Either<L, R> {
    return new Left<L, R>(value)
}

export function right<L, R>(value: R): Either<L, R> {
    return new Right<L, R>(value)
}
