
export interface Both<L, R> {
    leftCount: number
    rightCount: number

    rightAll: R[]

    map<N>(mapping: (R) => N): Both<L, N>

    doLeft(consumer: (L) => void): RightConsumption<R>
}

export interface RightConsumption<R> {
    doRight(consumer: (R) => void)
}

export interface BothBuilder<L, R> {
    left(left: L);
    right(right: R);
    append(both: Both<L, R>);

    build(): Both<L, R>
}

export function bothBuilder<L, R>(): BothBuilder<L, R> {
    return new BothImpl<L, R>(new Array<L>(), new Array<R>());
}

class BothImpl<L, R> implements Both<L, R>, BothBuilder<L, R> {

    get leftCount(): number {
        return this.leftValue.length;
    }
    get rightCount(): number {
        return this.rightValue.length;
    }

    private readonly leftValue: L[];
    private readonly rightValue: R[];

    constructor(l: L[], r: R[]) {
        this.leftValue = l;
        this.rightValue = r;
    }

    doLeft(leftConsumer: (L) => void): RightConsumption<R> {
        const lv = this.leftValue;
        const rv = this.rightValue;
        return {
            doRight(rightConsumer: (R) => void) {
                lv.forEach(leftConsumer);
                rv.forEach(rightConsumer);
            }
        };
    }

    left(left: L) {
        this.leftValue.push(left);
    }

    right(right: R) {
        this.rightValue.push(right);
    }

    build(): Both<L, R> {
        return this;
    }

    append(both: Both<L, R>) {
        both.doLeft(left => this.left(left))
            .doRight(right => this.right(right));
    }

    map<N>(mapping: (R) => N): Both<L, N> {
        const mapped = this.rightValue.map(mapping);
        return new BothImpl(this.leftValue, mapped);
    }

    get rightAll(): R[] {
        return this.rightValue;
    }
}
