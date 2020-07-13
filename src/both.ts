
export interface Both<L, R> {
    leftCount: number
    rightCount: number

    doLeft(consumer: (L) => void): RightConsumption<R>
}

export interface RightConsumption<R> {
    doRight(consumer: (R) => void)
}

export interface BothBuilder<L, R> {
    left(left: L);
    right(right: R);

    build(): Both<L, R>
}

export function bothBuilder<L, R>(): BothBuilder<L, R> {
    return new BothImpl<L, R>();
}

class BothImpl<L, R> implements Both<L, R>, BothBuilder<L, R> {
    get leftCount(): number {
        return 0;
    }
    rightCount: number;

    private readonly leftValue: L[];
    private readonly rightValue: R[];

    constructor() {
        this.leftValue = new Array<L>();
        this.rightValue = new Array<R>();
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
}
