import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

interface ZUnionOptions {
    WEIGHTS?: Array<number>;
    AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export function transformArguments(destination: string, keys: Array<string> | string, options?: ZUnionOptions): Array<string> {
    const args = ['ZUNIONSTORE', destination];

    if (typeof keys === 'string') {
        args.push('1', keys);
    } else {
        args.push(keys.length.toString(), ...keys);
    }

    if (options?.WEIGHTS) {
        args.push('WEIGHTS', ...options.WEIGHTS.map(weight => weight.toString()));
    }

    if (options?.AGGREGATE) {
        args.push('AGGREGATE', options.AGGREGATE);
    }

    return args;
}

export const transformReply = transformReplyNumber;
